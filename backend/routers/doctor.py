# routers/doctors.py
from __future__ import annotations

from typing import Optional, List, Tuple
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from pydantic import BaseModel, Field, confloat
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from app.db import get_db
from app import models
from app.deps import get_current_active_user

router = APIRouter(prefix="/doctor", tags=["doctor"])

# ---- Constants ---------------------------------------------------------------

VALID_STATUSES = {"Pending", "Accepted", "Rejected", "NeedsRevision"}
REVIEWABLE_STATUSES = {"Accepted", "Rejected", "NeedsRevision"}  # you can't "review" to Pending

# ---- Pydantic response models (kept inline for convenience) -----------------

class SubmissionListItem(BaseModel):
    id: int
    assignmentId: int
    studentId: int
    title: Optional[str] = None
    course: Optional[str] = None
    submittedAt: Optional[datetime] = None
    status: str
    fileName: Optional[str] = None
    filePath: Optional[str] = None
    fileType: Optional[str] = None
    notes: Optional[str] = None
    grade: Optional[confloat(ge=0, le=10)] = None  # included when requested

class FeedbackRead(BaseModel):
    id: int
    doctorId: Optional[int] = None
    text: Optional[str] = None
    grade: Optional[confloat(ge=0, le=10)] = None
    createdAt: Optional[datetime] = None

class SubmissionDetailResponse(BaseModel):
    submission: SubmissionListItem
    feedback: Optional[FeedbackRead] = None

class ReviewPayload(BaseModel):
    status: str = Field(..., description="Accepted | Rejected | NeedsRevision")
    grade: Optional[confloat(ge=0, le=10)] = None
    feedback_text: Optional[str] = None

class ReviewResponse(BaseModel):
    ok: bool
    submission: dict
    feedback: Optional[dict] = None

# ---- Helpers ----------------------------------------------------------------

def _require_doctor(user: models.User):
    if (user.role or "").lower() != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor role required")

def _has_attr(model_or_obj, name: str) -> bool:
    return hasattr(model_or_obj, name)

def _now():
    try:
        return datetime.utcnow()
    except Exception:
        return None

def _touch_created_updated(entity) -> None:
    now = _now()
    if _has_attr(entity, "created_at") and getattr(entity, "created_at") is None:
        setattr(entity, "created_at", now)
    if _has_attr(entity, "updated_at"):
        setattr(entity, "updated_at", now)

def _touch_updated(entity) -> None:
    if _has_attr(entity, "updated_at"):
        setattr(entity, "updated_at", _now())

def _submission_is_assigned_to_doctor(sub: models.Submission, doctor_user_id: int) -> bool:
    """
    Authorization helper: if your schema links submissions/assignments to a doctor,
    enforce that this doctor can only manage their own items. Works dynamically:
    - Prefer Submission.doctor_id / Submission.assigned_doctor_id / Submission.reviewer_id
    - Else check Assignment.doctor_id / Assignment.reviewer_id (if available)
    If none of these columns exist, return True (can't enforce).
    """
    # Direct link on Submission
    for col in ("doctor_id", "assigned_doctor_id", "reviewer_id"):
        if _has_attr(sub, col):
            return getattr(sub, col) == doctor_user_id

    # Fallback via Assignment relation if present
    if _has_attr(sub, "assignment") and sub.assignment is not None:
        for col in ("doctor_id", "reviewer_id"):
            if _has_attr(sub.assignment, col):
                return getattr(sub.assignment, col) == doctor_user_id

    # Could not determine ownership -> allow (schema doesn't provide linkage)
    return True

def _doctor_filter_sql() -> Tuple[str, str]:
    """
    For listing via raw SQL, return a tuple (clause, param_key) to restrict by doctor
    if model columns exist. Checks common column names on Submission/Assignment.
    Returns ("", "") if no suitable column exists.
    """
    # Prefer Submission columns
    if _has_attr(models.Submission, "doctor_id"):
        return " AND s.doctor_id = :docid ", "docid"
    if _has_attr(models.Submission, "assigned_doctor_id"):
        return " AND s.assigned_doctor_id = :docid ", "docid"
    if _has_attr(models.Submission, "reviewer_id"):
        return " AND s.reviewer_id = :docid ", "docid"

    # Then Assignment columns
    if _has_attr(models.Assignment, "doctor_id"):
        return " AND a.doctor_id = :docid ", "docid"
    if _has_attr(models.Assignment, "reviewer_id"):
        return " AND a.reviewer_id = :docid ", "docid"

    return "", ""  # no filter possible

# ---- Routes -----------------------------------------------------------------

@router.get(
    "/submissions",
    response_model=List[SubmissionListItem],
    summary="List submissions for review (doctor)",
)
def list_submissions_for_review(
    status_filter: Optional[str] = Query(None, description="Optional: Pending | Accepted | Rejected | NeedsRevision"),
    student_id: Optional[int]   = Query(None, description="Optional filter by student_id (User.id). If you pass a Student.student_id, it will be mapped automatically when possible."),
    assignment_id: Optional[int] = Query(None, description="Optional filter by assignment_id"),
    search: Optional[str]       = Query(None, description="Search assignment title"),
    include_feedback: bool      = Query(False, description="Join feedback to include current grade/text"),
    mine_only: bool             = Query(True, description="If true, restrict to submissions assigned to me (when schema supports it)"),
    limit: int                  = Query(50, ge=1, le=200),
    offset: int                 = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)

    if status_filter and status_filter not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status filter")

    # If caller passed a Student.student_id (from Student profile), map it to users.id via Student.user_id
    if student_id is not None:
        try:
            st = db.query(models.Student).filter(models.Student.student_id == student_id).first()
            if st:
                # If already linked, use linked auth user id
                if getattr(st, "user_id", None):
                    student_id = st.user_id
                else:
                    # Attempt to retro-link: find a User with username equal to student_number
                    # (this is how students should sign up to claim pre-provisioned accounts)
                    candidate_user = db.query(models.User).filter(models.User.username == st.student_number).first()
                    if candidate_user:
                        st.user_id = candidate_user.id
                        try:
                            db.commit()
                        except Exception:
                            db.rollback()
                        student_id = candidate_user.id
        except Exception:
            # best-effort mapping only; fall back to using the provided id as-is
            pass

    # dynamic doctor filter (if columns exist)
    doctor_clause, doctor_param = _doctor_filter_sql()
    doctor_bind = {doctor_param: current_user.id} if (mine_only and doctor_param) else {}

    # optional feedback join/columns
    fb_select = ", fb.grade AS grade, fb.feedback_text AS feedback_text" if include_feedback else ""
    fb_join = "LEFT JOIN SubmissionFeedback fb ON fb.submission_id = s.submission_id" if include_feedback else ""

    where_search = ""
    params = {"status": status_filter, "sid": student_id, "aid": assignment_id, **doctor_bind}
    if search and search.strip():
        where_search = " AND (a.title ILIKE :term) "
        params["term"] = f"%{search.strip()}%"

    sql = f"""
        SELECT
            s.submission_id, s.assignment_id, s.student_id, s.original_filename, s.file_path, s.file_type,
            s.submitted_at, s.status, s.student_notes,
            a.title AS assignment_title, d.name AS course
            {fb_select}
        FROM Submission s
        JOIN Assignment a ON a.assignment_id = s.assignment_id
        LEFT JOIN Department d ON d.department_id = a.department_id
        {fb_join}
        WHERE (:status IS NULL OR s.status = :status)
          AND (:sid IS NULL OR s.student_id = :sid)
          AND (:aid IS NULL OR s.assignment_id = :aid)
          {doctor_clause}
          {where_search}
        ORDER BY s.submitted_at DESC
        LIMIT :limit OFFSET :offset
    """
    params["limit"] = limit
    params["offset"] = offset

    rows = db.execute(text(sql), params).mappings().all()

    items: List[SubmissionListItem] = []
    for r in rows:
        item = SubmissionListItem(
            id=r["submission_id"],
            assignmentId=r["assignment_id"],
            studentId=r["student_id"],
            title=r.get("assignment_title"),
            course=r.get("course"),
            submittedAt=r.get("submitted_at"),
            status=r["status"],
            fileName=r.get("original_filename"),
            filePath=r.get("file_path"),
            fileType=r.get("file_type"),
            notes=r.get("student_notes"),
            grade=r.get("grade") if include_feedback else None,
        )
        items.append(item)
    return items


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionDetailResponse,
    summary="Get a single submission + (optional) feedback",
)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)

    sub = db.execute(
        text("""
        SELECT s.*, a.title AS assignment_title, d.name AS course
        FROM Submission s
        JOIN Assignment a ON a.assignment_id = s.assignment_id
        LEFT JOIN Department d ON d.department_id = a.department_id
        WHERE s.submission_id = :sid
        """),
        {"sid": submission_id},
    ).mappings().first()

    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # ORM object for authorization check (uses dynamic column detection)
    sub_obj = db.query(models.Submission).filter(models.Submission.submission_id == submission_id).first()
    if not _submission_is_assigned_to_doctor(sub_obj, current_user.id):
        raise HTTPException(status_code=403, detail="Not allowed to access this submission")

    fb = db.execute(
        text("""
        SELECT feedback_id, doctor_id, feedback_text, grade, created_at
        FROM SubmissionFeedback
        WHERE submission_id = :sid
        """),
        {"sid": submission_id},
    ).mappings().first()

    submission = SubmissionListItem(
        id=sub["submission_id"],
        assignmentId=sub["assignment_id"],
        studentId=sub["student_id"],
        title=sub.get("assignment_title"),
        course=sub.get("course"),
        fileName=sub.get("original_filename"),
        filePath=sub.get("file_path"),
        fileType=sub.get("file_type"),
        submittedAt=sub.get("submitted_at"),
        status=sub["status"],
        notes=sub.get("student_notes"),
    )

    feedback: Optional[FeedbackRead] = None
    if fb:
        feedback = FeedbackRead(
            id=fb["feedback_id"],
            doctorId=fb.get("doctor_id"),
            text=fb.get("feedback_text"),
            grade=fb.get("grade"),
            createdAt=fb.get("created_at"),
        )

    return SubmissionDetailResponse(submission=submission, feedback=feedback)


@router.post(
    "/submissions/{submission_id}/review",
    response_model=ReviewResponse,
    summary="Review (accept/reject/needs-revision) + upsert feedback/grade",
)
def review_submission(
    submission_id: int,
    payload: ReviewPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)

    if payload.status not in REVIEWABLE_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status. Use Accepted | Rejected | NeedsRevision")

    # Business rules (tweak as you like)
    if payload.status == "Accepted" and payload.grade is None:
        raise HTTPException(status_code=400, detail="Grade is required when status is Accepted")
    if payload.status == "NeedsRevision" and (payload.feedback_text is None or not payload.feedback_text.strip()):
        raise HTTPException(status_code=400, detail="Feedback text is required when status is NeedsRevision")

    sub = db.query(models.Submission).filter(models.Submission.submission_id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if not _submission_is_assigned_to_doctor(sub, current_user.id):
        raise HTTPException(status_code=403, detail="Not allowed to review this submission")

    try:
        # Upsert feedback
        fb = db.query(models.SubmissionFeedback).filter(
            models.SubmissionFeedback.submission_id == submission_id
        ).first()

        if fb:
            if payload.feedback_text is not None:
                fb.feedback_text = payload.feedback_text
            if payload.grade is not None:
                fb.grade = payload.grade
            # update doctor_id if column exists and is empty
            if _has_attr(fb, "doctor_id") and getattr(fb, "doctor_id", None) in (None, 0):
                fb.doctor_id = current_user.id
            _touch_updated(fb)
        else:
            fb_kwargs = dict(
                submission_id=submission_id,
                feedback_text=payload.feedback_text,
                grade=payload.grade,
            )
            if _has_attr(models.SubmissionFeedback, "doctor_id"):
                fb_kwargs["doctor_id"] = current_user.id
            fb = models.SubmissionFeedback(**fb_kwargs)
            _touch_created_updated(fb)
            db.add(fb)

        # Update submission status (+ optional reviewed_at if exists)
        sub.status = payload.status
        if _has_attr(sub, "reviewed_at"):
            sub.reviewed_at = _now()
        _touch_updated(sub)

        db.commit()
        db.refresh(sub)
        db.refresh(fb)

        return ReviewResponse(
            ok=True,
            submission={"id": sub.submission_id, "status": sub.status},
            feedback={"id": getattr(fb, "feedback_id"), "grade": getattr(fb, "grade"), "text": getattr(fb, "feedback_text")},
        )

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint error while saving review")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit review")


# ---- Doctor Profile (current user) -------------------------------------------

class DoctorProfileRead(BaseModel):
    doctor_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_id: Optional[int] = None
    role: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_id: Optional[int] = None


def _get_or_create_doctor_for_user(db: Session, user: models.User) -> models.Doctor:
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == user.id).first()
    if not doc:
        # Provide sensible defaults
        doc = models.Doctor(
            user_id=user.id,
            full_name=f"Dr. {user.username}",
            email=user.email,
            role="Doctor",
            department_id=1,
        )
        _touch_created_updated(doc)
        db.add(doc)
        db.commit()
        db.refresh(doc)
    return doc


@router.get("/profile/me", response_model=DoctorProfileRead)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    doc = _get_or_create_doctor_for_user(db, current_user)
    return DoctorProfileRead(
        doctor_id=doc.doctor_id,
        full_name=getattr(doc, "full_name", None),
        email=getattr(doc, "email", None),
        department_id=getattr(doc, "department_id", None),
        role=getattr(doc, "role", None),
    )


@router.put("/profile/me", response_model=DoctorProfileRead)
def update_my_doctor_profile(
    payload: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    try:
        doc = _get_or_create_doctor_for_user(db, current_user)

        update_data = payload.dict(exclude_unset=True)
        if "full_name" in update_data and hasattr(doc, "full_name"):
            doc.full_name = (update_data["full_name"] or "").strip() or doc.full_name
        if "email" in update_data and hasattr(doc, "email") and update_data["email"]:
            doc.email = update_data["email"].strip()
        if "department_id" in update_data and hasattr(doc, "department_id") and update_data["department_id"]:
            doc.department_id = int(update_data["department_id"])  # ensure numeric

        _touch_updated(doc)
        db.commit()
        db.refresh(doc)

        return DoctorProfileRead(
            doctor_id=doc.doctor_id,
            full_name=getattr(doc, "full_name", None),
            email=getattr(doc, "email", None),
            department_id=getattr(doc, "department_id", None),
            role=getattr(doc, "role", None),
        )

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update profile due to constraint violation")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update doctor profile")