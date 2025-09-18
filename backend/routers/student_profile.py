# routers/student_profile.py
from __future__ import annotations

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app import models
from app.deps import get_current_active_user

router = APIRouter(prefix="/student-profile", tags=["student-profile"])

# ---- Pydantic models --------------------------------------------------------

class StudentProfileUpdate(BaseModel):
    # Personal info (student editable)
    full_name: Optional[str] = Field(None, description="Student full name")
    email: Optional[str] = Field(None, description="Student email")
    phone: Optional[str] = Field(None, description="Student phone")
    # Extended profile
    gpa: Optional[float] = Field(None, description="Student's GPA", ge=0.0, le=4.0)
    date_of_birth: Optional[datetime] = Field(None, description="Student's date of birth")
    nationality: Optional[str] = Field(None, description="Student's nationality")
    address: Optional[str] = Field(None, description="Student's address")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_relationship: Optional[str] = Field(None, description="Emergency contact relationship")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")

class StudentProfileResponse(BaseModel):
    student_id: int
    student_number: str
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    year_level: str
    status: str
    graduation_year: Optional[int]
    notes: Optional[str]
    created_at: datetime
    user_id: Optional[int]
    
    # Enhanced profile fields
    gpa: Optional[float]
    date_of_birth: Optional[datetime]
    nationality: Optional[str]
    address: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_relationship: Optional[str]
    emergency_contact_phone: Optional[str]

class StudentCourseEnrollment(BaseModel):
    course_id: int
    course_title: str
    course_code: str
    credits: int
    department_name: str
    enrolled_at: datetime

class StudentAcademicInfo(BaseModel):
    overall_gpa: Optional[float]
    credits_completed: int
    credits_required: int
    current_courses: List[StudentCourseEnrollment]

class GPAUpdate(BaseModel):
    gpa: float = Field(..., ge=0.0, le=4.0, description="Student's GPA")

# ---- Helpers ----------------------------------------------------------------

def _require_doctor(user: models.User):
    if (user.role or "").lower() not in {"doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor or admin role required")

def _require_student_or_doctor(user: models.User):
    if (user.role or "").lower() not in {"student", "doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student, doctor, or admin role required")

# ---- Routes ----------------------------------------------------------------

@router.get(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Get complete student profile"
)
def get_student_profile(
    student_id: str,  # Changed to str to handle "me"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_student_or_doctor(current_user)
    
    # Handle "me" endpoint for students
    if student_id == "me":
        if current_user.role != "student":
            raise HTTPException(status_code=403, detail="Only students can use 'me' endpoint")
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
    else:
        # If user is a student, they can only view their own profile
        if current_user.role == "student":
            student = db.query(models.Student).filter(
                models.Student.user_id == current_user.id
            ).first()
            if not student or student.student_id != int(student_id):
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            # Doctor/admin can view any student profile
            student = db.query(models.Student).filter(models.Student.student_id == int(student_id)).first()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")
    
    return StudentProfileResponse(
        student_id=student.student_id,
        student_number=student.student_number,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        year_level=student.year_level,
        status=student.status,
        graduation_year=student.graduation_year,
        notes=student.notes,
        created_at=student.created_at,
        user_id=student.user_id,
        gpa=getattr(student, 'gpa', None),
        date_of_birth=getattr(student, 'date_of_birth', None),
        nationality=getattr(student, 'nationality', None),
        address=getattr(student, 'address', None),
        emergency_contact_name=getattr(student, 'emergency_contact_name', None),
        emergency_contact_relationship=getattr(student, 'emergency_contact_relationship', None),
        emergency_contact_phone=getattr(student, 'emergency_contact_phone', None),
    )



@router.put(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Update student profile (doctor can update GPA, student can update personal info)"
)
def update_student_profile(
    student_id: str,  # Changed to str to handle "me"
    profile_data: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_student_or_doctor(current_user)
    
    # Handle "me" endpoint for students
    if student_id == "me":
        if current_user.role != "student":
            raise HTTPException(status_code=403, detail="Only students can use 'me' endpoint")
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
    else:
        # Get student
        if current_user.role == "student":
            student = db.query(models.Student).filter(
                models.Student.user_id == current_user.id
            ).first()
            if not student or student.student_id != int(student_id):
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            student = db.query(models.Student).filter(models.Student.student_id == int(student_id)).first()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")
    
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)

    # Students can only update personal info, not GPA
    if current_user.role == "student" and "gpa" in update_data:
        raise HTTPException(status_code=403, detail="Students cannot update their own GPA")

    # Apply changes to Student model
    for field, value in update_data.items():
        if hasattr(models.Student, field) and hasattr(student, field):
            setattr(student, field, value)
    
    try:
        db.commit()
        db.refresh(student)
        
        # Also update the User table if full_name is being updated
        if "full_name" in update_data and student.user_id:
            user = db.query(models.User).filter(models.User.id == student.user_id).first()
            if user:
                # Update the user's username to match the new full_name for consistency
                # This ensures the /auth/me endpoint returns the updated name
                pass  # We don't update username, just keep the full_name in Student table
        
        return StudentProfileResponse(
            student_id=student.student_id,
            student_number=student.student_number,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            year_level=student.year_level,
            status=student.status,
            graduation_year=student.graduation_year,
            notes=student.notes,
            created_at=student.created_at,
            user_id=student.user_id,
            gpa=getattr(student, 'gpa', None),
            date_of_birth=getattr(student, 'date_of_birth', None),
            nationality=getattr(student, 'nationality', None),
            address=getattr(student, 'address', None),
            emergency_contact_name=getattr(student, 'emergency_contact_name', None),
            emergency_contact_relationship=getattr(student, 'emergency_contact_relationship', None),
            emergency_contact_phone=getattr(student, 'emergency_contact_phone', None),
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update profile")



@router.get(
    "/{student_id}/academic-info",
    response_model=StudentAcademicInfo,
    summary="Get student academic information including courses and GPA"
)
def get_student_academic_info(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_student_or_doctor(current_user)
    
    # Get student
    if current_user.role == "student":
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id
        ).first()
        if not student or student.student_id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
    
    # Get GPA from student record
    overall_gpa = getattr(student, 'gpa', None)
    
    # For now, return mock data for courses and credits
    # In a real implementation, you would have a CourseEnrollment table
    current_courses = []
    credits_completed = 0
    credits_required = 120  # Typical dental program requirement
    
    # Mock some courses for demonstration
    if student.year_level == "Fourth":
        current_courses = [
            StudentCourseEnrollment(
                course_id=1,
                course_title="Advanced Oral Surgery",
                course_code="DENT401",
                credits=4,
                department_name="Oral Surgery",
                enrolled_at=datetime.utcnow()
            ),
            StudentCourseEnrollment(
                course_id=2,
                course_title="Orthodontics Clinical Practice",
                course_code="DENT402",
                credits=3,
                department_name="Orthodontics",
                enrolled_at=datetime.utcnow()
            ),
            StudentCourseEnrollment(
                course_id=3,
                course_title="Periodontics",
                course_code="DENT403",
                credits=3,
                department_name="Periodontics",
                enrolled_at=datetime.utcnow()
            )
        ]
        credits_completed = 90  # Mock completed credits
    
    return StudentAcademicInfo(
        overall_gpa=overall_gpa,
        credits_completed=credits_completed,
        credits_required=credits_required,
        current_courses=current_courses
    )

@router.post(
    "/{student_id}/update-gpa",
    response_model=StudentProfileResponse,
    summary="Update student GPA (doctor only)"
)
def update_student_gpa(
    student_id: int,
    gpa_data: GPAUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update GPA
    if hasattr(student, 'gpa'):
        student.gpa = gpa_data.gpa
    else:
        # If the column doesn't exist yet, we'll handle it gracefully
        pass
    
    try:
        db.commit()
        db.refresh(student)
        
        return StudentProfileResponse(
            student_id=student.student_id,
            student_number=student.student_number,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            year_level=student.year_level,
            status=student.status,
            graduation_year=student.graduation_year,
            notes=student.notes,
            created_at=student.created_at,
            user_id=student.user_id,
            gpa=getattr(student, 'gpa', None),
            date_of_birth=getattr(student, 'date_of_birth', None),
            nationality=getattr(student, 'nationality', None),
            address=getattr(student, 'address', None),
            emergency_contact_name=getattr(student, 'emergency_contact_name', None),
            emergency_contact_relationship=getattr(student, 'emergency_contact_relationship', None),
            emergency_contact_phone=getattr(student, 'emergency_contact_phone', None),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update GPA")
