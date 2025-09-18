from __future__ import annotations

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_

from app.db import get_db
from app import models
from app.deps import get_current_active_user
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    AssignmentSummary,
)


router = APIRouter(prefix="/assignments", tags=["assignments"])
@router.get("/_ping")
def _ping():
    return {"ok": True}

def _to_read(row: models.Assignment) -> AssignmentRead:
    """Convert database model to response schema."""
    return AssignmentRead(
        assignment_id=row.assignment_id,
        title=row.title,
        description=row.description,
        deadline=row.deadline,
        type_id=row.type_id,
        department_id=row.department_id,
        max_file_size_mb=row.max_file_size_mb,
        instructions=row.instructions,
        is_active=row.is_active,
        created_at=row.created_at.isoformat() if row.created_at else None,
        updated_at=row.updated_at.isoformat() if row.updated_at else None,
        type_name=row.assignment_type.name if row.assignment_type else None,
        department_name=row.department.name if row.department else None,
        submissions_count=len(row.submissions) if row.submissions else 0,
    )


def _to_summary(row: models.Assignment) -> AssignmentSummary:
    """Convert database model to summary schema."""
    return AssignmentSummary(
        assignment_id=row.assignment_id,
        title=row.title,
        deadline=row.deadline,
        type_name=row.assignment_type.name if row.assignment_type else None,
        department_name=row.department.name if row.department else None,
        is_active=row.is_active,
        submissions_count=len(row.submissions) if row.submissions else 0,
    )


def _validate_assignment_exists(
    assignment_id: int, 
    db: Session, 
    include_inactive: bool = False
) -> models.Assignment:
    """Validate that assignment exists and return it."""
    if assignment_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment ID must be positive"
        )
    
    query = db.query(models.Assignment).options(
        joinedload(models.Assignment.assignment_type),
        joinedload(models.Assignment.department),
        joinedload(models.Assignment.submissions)
    ).filter(models.Assignment.assignment_id == assignment_id)
    
    if not include_inactive:
        query = query.filter(models.Assignment.is_active == True)
    
    assignment = query.first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    return assignment


def _validate_foreign_keys(
    type_id: int, 
    department_id: int, 
    db: Session
) -> tuple[models.AssignmentType, models.Department]:
    """Validate that assignment type and department exist."""
    # Validate assignment type
    assignment_type = db.query(models.AssignmentType).filter(
        models.AssignmentType.type_id == type_id,
        models.AssignmentType.is_active == True
    ).first()
    
    if not assignment_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or inactive assignment type"
        )
    
    # Validate department
    department = db.query(models.Department).filter(
        models.Department.department_id == department_id,
        models.Department.is_active == True
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or inactive department"
        )
    
    return assignment_type, department


@router.get("", response_model=List[AssignmentSummary])
def list_assignments(
    include_inactive: bool = Query(False, description="Include inactive assignments"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    type_id: Optional[int] = Query(None, description="Filter by assignment type ID"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """List assignments with optional filtering and pagination."""
    try:
        query = db.query(models.Assignment).options(
            joinedload(models.Assignment.assignment_type),
            joinedload(models.Assignment.department),
            joinedload(models.Assignment.submissions)
        )
        
        # Apply filters
        if not include_inactive:
            query = query.filter(models.Assignment.is_active == True)
        
        if department_id:
            query = query.filter(models.Assignment.department_id == department_id)
        
        if type_id:
            query = query.filter(models.Assignment.type_id == type_id)
        
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.Assignment.title.ilike(search_term),
                    models.Assignment.description.ilike(search_term)
                )
            )
        
        # Apply pagination and ordering
        rows = query.order_by(
            models.Assignment.deadline.asc()
        ).offset(offset).limit(limit).all()
        
        return [_to_summary(r) for r in rows]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assignments"
        )


@router.get("/{assignment_id}", response_model=AssignmentRead)
def get_assignment(
    assignment_id: int,
    include_inactive: bool = Query(False, description="Include inactive assignments"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get a specific assignment by ID."""
    assignment = _validate_assignment_exists(assignment_id, db, include_inactive)
    return _to_read(assignment)

@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Create a new assignment."""
    try:
        # 1) Validate foreign keys (type_id & department_id must exist and be active)
        _validate_foreign_keys(assignment_data.type_id, assignment_data.department_id, db)

        # 2) Resolve doctor -> created_by (required by DB)
        doctor = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor profile not found for current user")

        # 3) Prevent duplicate title within the same department
        existing = db.query(models.Assignment).filter(
            models.Assignment.title == assignment_data.title,
            models.Assignment.department_id == assignment_data.department_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Assignment with this title already exists in this department",
            )

        # 4) Create row
        assignment = models.Assignment(
            title=assignment_data.title.strip(),
            description=assignment_data.description,
            deadline=assignment_data.deadline,                  # DATETIME
            type_id=assignment_data.type_id,                    # FK -> AssignmentType.type_id
            department_id=assignment_data.department_id,        # FK -> Department.department_id
            target_year=assignment_data.target_year or "All",   # target year
            max_grade=assignment_data.max_grade or 100.0,       # maximum grade
            max_file_size_mb=assignment_data.max_file_size_mb or 20,
            instructions=assignment_data.instructions,
            is_active=True if assignment_data.is_active is None else assignment_data.is_active,
            created_by=doctor.doctor_id,                        # REQUIRED
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        # 5) Return hydrated object
        assignment = _validate_assignment_exists(assignment.assignment_id, db, include_inactive=True)
        return _to_read(assignment)

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Assignment with this title already exists in this department")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create assignment")


@router.put("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Update an existing assignment."""
    try:
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        
        # Validate foreign keys if they're being updated
        if assignment_data.type_id or assignment_data.department_id:
            type_id = assignment_data.type_id or assignment.type_id
            department_id = assignment_data.department_id or assignment.department_id
            _validate_foreign_keys(type_id, department_id, db)
        
        # Check if new title conflicts with existing (if title is being updated)
        if assignment_data.title and assignment_data.title != assignment.title:
            department_id = assignment_data.department_id or assignment.department_id
            existing = db.query(models.Assignment).filter(
                models.Assignment.title == assignment_data.title,
                models.Assignment.department_id == department_id,
                models.Assignment.assignment_id != assignment_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignment with this title already exists in this department"
                )
        
        # Update fields that are provided
        update_data = assignment_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(assignment, field, value)
        
        assignment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        
        # Reload with relationships
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        return _to_read(assignment)
    
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment with this title already exists in this department"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assignment"
        )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    soft_delete: bool = Query(True, description="Use soft delete (deactivate) instead of hard delete"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Delete or deactivate an assignment."""
    try:
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        
        # Check if assignment has submissions
        submissions_count = len(assignment.submissions)
        
        if submissions_count > 0 and not soft_delete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete assignment: {submissions_count} submissions exist. Use soft delete instead."
            )
        
        if soft_delete:
            # Soft delete - just deactivate
            assignment.is_active = False
            assignment.updated_at = datetime.utcnow()
            db.commit()
        else:
            # Hard delete - only if no submissions exist
            db.delete(assignment)
            db.commit()
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete assignment"
        )


@router.patch("/{assignment_id}/activate", response_model=AssignmentRead)
def activate_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Activate a deactivated assignment."""
    try:
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        
        if assignment.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment is already active"
            )
        
        # Check if deadline is still in the future
        if assignment.deadline <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot activate assignment with past deadline"
            )
        
        assignment.is_active = True
        assignment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        
        # Reload with relationships
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        return _to_read(assignment)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate assignment"
        )


@router.patch("/{assignment_id}/deactivate", response_model=AssignmentRead)
def deactivate_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Deactivate an assignment."""
    try:
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        
        if not assignment.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment is already inactive"
            )
        
        assignment.is_active = False
        assignment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        
        # Reload with relationships
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        return _to_read(assignment)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate assignment"
        )


@router.get("/{assignment_id}/submissions-count")
def get_submissions_count(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get the count of submissions for this assignment."""
    try:
        assignment = _validate_assignment_exists(assignment_id, db, include_inactive=True)
        
        count = db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment_id
        ).count()
        
        return {
            "assignment_id": assignment_id,
            "assignment_title": assignment.title,
            "submissions_count": count,
            "deadline": assignment.deadline.isoformat(),
            "is_active": assignment.is_active
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get submissions count"
        )


@router.get("/department/{department_id}", response_model=List[AssignmentSummary])
def list_assignments_by_department(
    department_id: int,
    include_inactive: bool = Query(False, description="Include inactive assignments"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """List assignments for a specific department."""
    try:
        if department_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department ID must be positive"
            )
        
        # Validate department exists
        department = db.query(models.Department).filter(
            models.Department.department_id == department_id
        ).first()
        
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )
        
        query = db.query(models.Assignment).options(
            joinedload(models.Assignment.assignment_type),
            joinedload(models.Assignment.department),
            joinedload(models.Assignment.submissions)
        ).filter(models.Assignment.department_id == department_id)
        
        if not include_inactive:
            query = query.filter(models.Assignment.is_active == True)
        
        rows = query.order_by(
            models.Assignment.deadline.asc()
        ).offset(offset).limit(limit).all()
        
        return [_to_summary(r) for r in rows]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assignments for department"
        )


@router.get("/upcoming", response_model=List[AssignmentSummary])
def list_upcoming_assignments(
    days_ahead: int = Query(7, ge=1, le=365, description="Number of days to look ahead"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """List upcoming assignments within the specified time frame."""
    try:
        from datetime import timedelta
        
        now = datetime.utcnow()
        future_date = now + timedelta(days=days_ahead)
        
        rows = db.query(models.Assignment).options(
            joinedload(models.Assignment.assignment_type),
            joinedload(models.Assignment.department),
            joinedload(models.Assignment.submissions)
        ).filter(
            and_(
                models.Assignment.is_active == True,
                models.Assignment.deadline > now,
                models.Assignment.deadline <= future_date
            )
        ).order_by(
            models.Assignment.deadline.asc()
        ).limit(limit).all()
        
        return [_to_summary(r) for r in rows]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve upcoming assignments"
        )