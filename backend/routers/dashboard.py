# routers/dashboard.py
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, distinct, text
from sqlalchemy.orm import Session

from app.db import get_db
from app import models
from app.deps import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ------------------------------ Constants -------------------------------------

VALID_STATUSES = {"Pending", "Accepted", "Rejected", "NeedsRevision"}

# ------------------------------ Helpers ---------------------------------------

def _has_attr(obj, name: str) -> bool:
    return hasattr(obj, name)

def _role(user: models.User) -> str:
    return (user.role or "").lower()

def _require_role(user: models.User, roles: set[str]):
    if _role(user) not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Requires one of roles: {', '.join(sorted(roles))}")

def _now() -> datetime:
    return datetime.utcnow()

def _doctor_filter_sql() -> Tuple[str, str]:
    """
    Build a SQL WHERE fragment that restricts submissions to those 'owned' by the doctor.
    Returns (clause, bind_key) or ("", "") if schema doesn't support such linkage.
    """
    if _has_attr(models.Submission, "doctor_id"):
        return " AND s.doctor_id = :docid ", "docid"
    if _has_attr(models.Submission, "assigned_doctor_id"):
        return " AND s.assigned_doctor_id = :docid ", "docid"
    if _has_attr(models.Submission, "reviewer_id"):
        return " AND s.reviewer_id = :docid ", "docid"
    if _has_attr(models.Assignment, "doctor_id"):
        return " AND a.doctor_id = :docid ", "docid"
    if _has_attr(models.Assignment, "reviewer_id"):
        return " AND a.reviewer_id = :docid ", "docid"
    return "", ""

def _doctor_filter_orm(q, current_user: models.User):
    """
    Best-effort ORM restriction for doctors on a Submission query.
    """
    if _role(current_user) != "doctor":
        return q
    if _has_attr(models.Submission, "doctor_id"):
        return q.filter(models.Submission.doctor_id == current_user.id)
    if _has_attr(models.Submission, "assigned_doctor_id"):
        return q.filter(models.Submission.assigned_doctor_id == current_user.id)
    if _has_attr(models.Submission, "reviewer_id"):
        return q.filter(models.Submission.reviewer_id == current_user.id)
    # Fallback via Assignment relation, if mapped
    if _has_attr(models.Submission, "assignment") and _has_attr(models.Assignment, "doctor_id"):
        return q.join(models.Submission.assignment).filter(models.Assignment.doctor_id == current_user.id)
    if _has_attr(models.Submission, "assignment") and _has_attr(models.Assignment, "reviewer_id"):
        return q.join(models.Submission.assignment).filter(models.Assignment.reviewer_id == current_user.id)
    return q  # cannot restrict

def _counts_by_status(q) -> Dict[str, int]:
    counts = {s: 0 for s in VALID_STATUSES}
    # Use SQL GROUP BY when possible
    try:
        for status_value, cnt in q.with_entities(models.Submission.status, func.count()).group_by(models.Submission.status):
            if status_value in counts:
                counts[status_value] = cnt
    except Exception:
        pass
    return counts

def _time_bounds(
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    default_days: int = 30
) -> Tuple[Optional[datetime], Optional[datetime]]:
    if date_from is None and date_to is None:
        date_to = _now()
        date_from = date_to - timedelta(days=default_days)
    return date_from, date_to

# ------------------------------ Responses (dict) ------------------------------
# Keeping response_model=dict for flexibility across your evolving schema.

# ------------------------------ Routes ----------------------------------------

@router.get(
    "/summary",
    response_model=dict,
    summary="Role-aware dashboard summary (admin/doctor/student)."
)
def dashboard_summary(
    from_date: Optional[datetime] = Query(None, description="UTC start (defaults to now-30d)"),
    to_date: Optional[datetime] = Query(None, description="UTC end (defaults to now)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Returns a compact set of 'cards' tailored to the caller's role:
    - admin: users, departments, assignments, submissions (by status), recent registrations/submissions
    - doctor: my submissions (by status), pending count, distinct students, recent my submissions
    - student: my submissions (by status), recent my submissions
    """
    role = _role(current_user)
    date_from, date_to = _time_bounds(from_date, to_date)

    base = {
        "role": role,
        "generated_at": _now().isoformat(),
        "window": {"from": date_from.isoformat() if date_from else None, "to": date_to.isoformat() if date_to else None},
        "cards": {}
    }

    # ---------------- Admin cards ----------------
    if role == "admin":
        # Users
        users_total = db.query(models.User).count()
        active = db.query(models.User).filter(models.User.is_active == True).count() if _has_attr(models.User, "is_active") else None  # noqa: E712
        inactive = (users_total - active) if (users_total is not None and active is not None) else None

        # by role (student/teacher/doctor/admin)
        by_role: Dict[str, int] = {}
        try:
            for r, cnt in db.query(models.User.role, func.count()).group_by(models.User.role).all():
                if r:
                    by_role[str(r)] = cnt
        except Exception:
            pass

        base["cards"]["users"] = {
            "total": users_total,
            "active": active,
            "inactive": inactive,
            "by_role": by_role,
        }

        # Departments & assignments (totals)
        if hasattr(models, "Department"):
            base["cards"]["departments"] = {"total": db.query(models.Department).count()}
        if hasattr(models, "Assignment"):
            base["cards"]["assignments"] = {"total": db.query(models.Assignment).count()}

        # Submissions (global)
        q_sub = db.query(models.Submission)
        if date_from:
            q_sub = q_sub.filter(models.Submission.submitted_at >= date_from)
        if date_to:
            q_sub = q_sub.filter(models.Submission.submitted_at <= date_to)

        subs_total = q_sub.count()
        base["cards"]["submissions"] = {
            "total": subs_total,
            "by_status": _counts_by_status(q_sub),
        }

        # Recent registrations (last 30 days, independent of from/to)
        if _has_attr(models.User, "created_at"):
            thirty = _now() - timedelta(days=30)
            base["cards"]["recent_registrations_30d"] = db.query(models.User).filter(models.User.created_at >= thirty).count()

        # Recent submissions list (latest 10)
        rows = (
            db.query(models.Submission)
            .order_by(models.Submission.submitted_at.desc())
            .limit(10)
            .all()
        )
        base["cards"]["recent_submissions"] = [
            {
                "id": r.submission_id,
                "assignmentId": r.assignment_id,
                "studentId": r.student_id,
                "submittedAt": r.submitted_at,
                "status": r.status,
                "fileName": r.original_filename,
            }
            for r in rows
        ]
        return base

    # ---------------- Doctor cards ----------------
    if role == "doctor":
        q = db.query(models.Submission)
        q = _doctor_filter_orm(q, current_user)

        if date_from:
            q = q.filter(models.Submission.submitted_at >= date_from)
        if date_to:
            q = q.filter(models.Submission.submitted_at <= date_to)

        total = q.count()
        by_status = _counts_by_status(q)

        # pending mine
        pending_count = q.filter(models.Submission.status == "Pending").count()

        # distinct students
        try:
            distinct_students = q.with_entities(func.count(distinct(models.Submission.student_id))).scalar()
        except Exception:
            distinct_students = None

        base["cards"]["my_submissions"] = {
            "total": total,
            "by_status": by_status,
            "pending": pending_count,
            "distinct_students": distinct_students,
        }

        # latest 10 of mine
        rows = (
            _doctor_filter_orm(db.query(models.Submission), current_user)
            .order_by(models.Submission.submitted_at.desc())
            .limit(10)
            .all()
        )
        base["cards"]["recent_mine"] = [
            {
                "id": r.submission_id,
                "assignmentId": r.assignment_id,
                "studentId": r.student_id,
                "submittedAt": r.submitted_at,
                "status": r.status,
                "fileName": r.original_filename,
            }
            for r in rows
        ]

        # average grade of reviewed items (where feedback exists)
        avg_grade = None
        try:
            q_fb = db.query(func.avg(models.SubmissionFeedback.grade)).join(
                models.Submission,
                models.SubmissionFeedback.submission_id == models.Submission.submission_id
            )
            q_fb = _doctor_filter_orm(q_fb, current_user)
            avg_grade = q_fb.scalar()
        except Exception:
            pass

        base["cards"]["grades"] = {"average": avg_grade}
        return base

    # ---------------- Student cards ----------------
    if role == "student":
        q = db.query(models.Submission).filter(models.Submission.student_id == current_user.id)
        if date_from:
            q = q.filter(models.Submission.submitted_at >= date_from)
        if date_to:
            q = q.filter(models.Submission.submitted_at <= date_to)

        total = q.count()
        by_status = _counts_by_status(q)

        base["cards"]["my_submissions"] = {
            "total": total,
            "by_status": by_status,
        }

        rows = (
            db.query(models.Submission)
            .filter(models.Submission.student_id == current_user.id)
            .order_by(models.Submission.submitted_at.desc())
            .limit(10)
            .all()
        )
        base["cards"]["recent_mine"] = [
            {
                "id": r.submission_id,
                "assignmentId": r.assignment_id,
                "submittedAt": r.submitted_at,
                "status": r.status,
                "fileName": r.original_filename,
            }
            for r in rows
        ]
        return base

    # Unknown role -> minimal info
    return {
        "role": role,
        "generated_at": _now().isoformat(),
        "cards": {},
        "note": "No dashboard data available for this role."
    }


@router.get(
    "/recent/submissions",
    response_model=dict,
    summary="Recent submissions list with joins (role-aware)."
)
def recent_submissions(
    mine_only: bool = Query(False, description="For doctors, restrict to my assigned items when possible"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search assignment title"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    role = _role(current_user)
    if role not in {"admin", "doctor", "student"}:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # Build doctor filter (SQL flavor)
    doctor_clause, doctor_param = _doctor_filter_sql()
    doctor_bind = {}
    if role == "doctor" and mine_only and doctor_param:
        doctor_bind = {doctor_param: current_user.id}

    where_student_clause = ""
    params = {"limit": limit, "offset": offset, **doctor_bind}

    if role == "student":
        where_student_clause = " AND s.student_id = :myid "
        params["myid"] = current_user.id

    where_search = ""
    if search and search.strip():
        where_search = " AND (a.title ILIKE :term) "
        params["term"] = f"%{search.strip()}%"

    sql = f"""
        SELECT
            s.submission_id, s.assignment_id, s.student_id, s.original_filename, s.file_path, s.file_type,
            s.submitted_at, s.status, s.student_notes,
            a.title AS assignment_title,
            u.username AS student_username
        FROM Submission s
        JOIN Assignment a ON a.assignment_id = s.assignment_id
        JOIN users u ON u.id = s.student_id
        WHERE 1=1
          {where_student_clause}
          {doctor_clause}
          {where_search}
        ORDER BY s.submitted_at DESC
        LIMIT :limit OFFSET :offset
    """
    rows = db.execute(text(sql), params).mappings().all()

    return {
        "count": len(rows),
        "items": [
            {
                "id": r["submission_id"],
                "assignmentId": r["assignment_id"],
                "studentId": r["student_id"],
                "studentUsername": r.get("student_username"),
                "title": r.get("assignment_title"),
                "submittedAt": r.get("submitted_at"),
                "status": r["status"],
                "fileName": r.get("original_filename"),
                "fileType": r.get("file_type"),
            } for r in rows
        ]
    }


@router.get(
    "/kpis",
    response_model=dict,
    summary="Tiny KPI set (role-aware, fast)."
)
def dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Fast KPI endpoint intended for header widgets.
    """
    role = _role(current_user)
    out = {"role": role, "generated_at": _now().isoformat(), "kpis": {}}

    if role == "admin":
        out["kpis"]["users_total"] = db.query(models.User).count()
        out["kpis"]["departments_total"] = db.query(models.Department).count() if hasattr(models, "Department") else None
        out["kpis"]["assignments_total"] = db.query(models.Assignment).count() if hasattr(models, "Assignment") else None
        out["kpis"]["submissions_total"] = db.query(models.Submission).count()
        out["kpis"]["pending_submissions"] = db.query(models.Submission).filter(models.Submission.status == "Pending").count()
        return out

    if role == "doctor":
        q = _doctor_filter_orm(db.query(models.Submission), current_user)
        out["kpis"]["my_total"] = q.count()
        out["kpis"]["my_pending"] = q.filter(models.Submission.status == "Pending").count()
        try:
            out["kpis"]["my_students"] = _doctor_filter_orm(db.query(models.Submission), current_user) \
                .with_entities(func.count(distinct(models.Submission.student_id))).scalar()
        except Exception:
            out["kpis"]["my_students"] = None
        return out

    if role == "student":
        q = db.query(models.Submission).filter(models.Submission.student_id == current_user.id)
        out["kpis"]["my_total"] = q.count()
        out["kpis"]["my_pending"] = q.filter(models.Submission.status == "Pending").count()
        return out

    return out
