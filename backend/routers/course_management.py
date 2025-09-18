# routers/course_management.py
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

router = APIRouter(prefix="/course-management", tags=["course-management"])

# ---- Pydantic models --------------------------------------------------------

class CourseCreate(BaseModel):
    title: str = Field(..., description="Course/assignment title")
    description: Optional[str] = Field(None, description="Course description")
    type_id: int = Field(..., description="Assignment type ID")
    department_id: int = Field(..., description="Department ID")
    target_year: str = Field("All", description="Target year level")
    deadline: datetime = Field(..., description="Assignment deadline")
    max_grade: float = Field(100.0, description="Maximum grade")

class CourseResponse(BaseModel):
    assignment_id: int
    title: str
    description: Optional[str]
    type_id: int
    department_id: int
    target_year: str
    deadline: datetime
    max_grade: float
    created_by: int
    created_at: datetime

# New models for actual Course creation
class CourseCreateRequest(BaseModel):
    title: str = Field(..., description="Course title")
    description: Optional[str] = Field(None, description="Course description")
    code: str = Field(..., description="Course code (e.g., DENT401)")
    credits: int = Field(3, description="Number of credits", ge=1, le=10)
    department_id: int = Field(..., description="Department ID")

class CourseCreateResponse(BaseModel):
    course_id: int
    title: str
    description: Optional[str]
    code: str
    credits: int
    department_id: int
    created_by: int
    is_active: int
    created_at: datetime

# Course Enrollment Models
class CourseEnrollmentCreate(BaseModel):
    course_id: int = Field(..., description="Course ID to enroll in")
    student_id: int = Field(..., description="Student ID to enroll")

class CourseEnrollmentResponse(BaseModel):
    enrollment_id: int
    course_id: int
    student_id: int
    enrolled_at: datetime
    status: str
    grade: Optional[float]
    notes: Optional[str]
    # Include course details
    course_title: str
    course_code: str
    course_credits: int
    department_name: str

class CourseWithEnrollments(BaseModel):
    course_id: int
    title: str
    description: Optional[str]
    code: str
    credits: int
    department_id: int
    created_by: int
    is_active: int
    created_at: datetime
    # Include enrollment count
    enrollment_count: int
    department_name: str

# ---- Helpers ----------------------------------------------------------------

def _require_doctor(user: models.User):
    if (user.role or "").lower() not in {"doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor or admin role required")

def _validate_target_year(target_year: str):
    valid_years = {"All", "First", "Second", "Third", "Fourth", "Fifth"}
    if target_year not in valid_years:
        raise HTTPException(status_code=400, detail=f"Invalid target year. Must be one of: {', '.join(valid_years)}")

def _validate_max_grade(max_grade: float):
    if max_grade <= 0 or max_grade > 100:
        raise HTTPException(status_code=400, detail="Maximum grade must be between 0 and 100")

# ---- Routes ----------------------------------------------------------------

@router.post(
    "/courses",
    response_model=CourseCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new course (doctor only)"
)
def create_course(
    course_data: CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    # Validate department exists
    department = db.query(models.Department).filter(
        models.Department.department_id == course_data.department_id
    ).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if course code already exists
    existing_course = db.query(models.Course).filter(
        models.Course.code == course_data.code
    ).first()
    
    if existing_course:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    # Get doctor ID from current user, create if doesn't exist
    doctor = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doctor:
        # Create a default Doctor record for the user
        # Use the first available department as default
        default_department = db.query(models.Department).first()
        if not default_department:
            raise HTTPException(status_code=400, detail="No departments available. Please create a department first.")
        
        doctor = models.Doctor(
            full_name=current_user.username,  # Use username as default name
            email=current_user.email,
            role="Lecturer",
            department_id=default_department.department_id,
            user_id=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
    
    # Create new course
    try:
        new_course = models.Course(
            title=course_data.title,
            description=course_data.description,
            code=course_data.code,
            credits=course_data.credits,
            department_id=course_data.department_id,
            created_by=doctor.doctor_id,
            is_active=1,
            created_at=datetime.utcnow()
        )
        
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        
        return CourseCreateResponse(
            course_id=new_course.course_id,
            title=new_course.title,
            description=new_course.description,
            code=new_course.code,
            credits=new_course.credits,
            department_id=new_course.department_id,
            created_by=new_course.created_by,
            is_active=new_course.is_active,
            created_at=new_course.created_at
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create course. Please check your input.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post(
    "/assignments",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new assignment (doctor only)"
)
def create_assignment(
    assignment_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    # Validate input
    _validate_target_year(assignment_data.target_year)
    _validate_max_grade(assignment_data.max_grade)
    
    # Validate assignment type exists
    assignment_type = db.query(models.AssignmentType).filter(
        models.AssignmentType.type_id == assignment_data.type_id
    ).first()
    
    if not assignment_type:
        raise HTTPException(status_code=404, detail="Assignment type not found")
    
    # Validate department exists
    department = db.query(models.Department).filter(
        models.Department.department_id == assignment_data.department_id
    ).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Get doctor ID from current user
    doctor = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Create new assignment
    try:
        new_assignment = models.Assignment(
            title=assignment_data.title,
            description=assignment_data.description,
            type_id=assignment_data.type_id,
            department_id=assignment_data.department_id,
            created_by=doctor.doctor_id,
            target_year=assignment_data.target_year,
            deadline=assignment_data.deadline,
            max_grade=assignment_data.max_grade,
            created_at=datetime.utcnow()
        )
        
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        
        return CourseResponse(
            assignment_id=new_assignment.assignment_id,
            title=new_assignment.title,
            description=new_assignment.description,
            type_id=new_assignment.type_id,
            department_id=new_assignment.department_id,
            target_year=new_assignment.target_year,
            deadline=new_assignment.deadline,
            max_grade=new_assignment.max_grade,
            created_by=new_assignment.created_by,
            created_at=new_assignment.created_at
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create assignment. Please check your input.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/assignments",
    response_model=List[CourseResponse],
    summary="List all assignments (doctor only)"
)
def list_assignments(
    department_id: Optional[int] = None,
    type_id: Optional[int] = None,
    target_year: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    query = db.query(models.Assignment)
    
    # Apply filters
    if department_id:
        query = query.filter(models.Assignment.department_id == department_id)
    
    if type_id:
        query = query.filter(models.Assignment.type_id == type_id)
    
    if target_year:
        _validate_target_year(target_year)
        query = query.filter(models.Assignment.target_year == target_year)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(models.Assignment.title.ilike(search_term))
    
    # Apply pagination and ordering
    assignments = query.order_by(models.Assignment.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        CourseResponse(
            assignment_id=assignment.assignment_id,
            title=assignment.title,
            description=assignment.description,
            type_id=assignment.type_id,
            department_id=assignment.department_id,
            target_year=assignment.target_year,
            deadline=assignment.deadline,
            max_grade=assignment.max_grade,
            created_by=assignment.created_by,
            created_at=assignment.created_at
        )
        for assignment in assignments
    ]

@router.get(
    "/courses",
    response_model=List[CourseWithEnrollments],
    summary="List all courses with enrollment info"
)
def list_courses_with_enrollments(
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """List all courses with enrollment information"""
    
    query = db.query(models.Course)
    
    # Apply filters
    if department_id:
        query = query.filter(models.Course.department_id == department_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Course.title.ilike(search_term)) |
            (models.Course.code.ilike(search_term)) |
            (models.Course.description.ilike(search_term))
        )
    
    # Apply pagination and ordering
    courses = query.order_by(models.Course.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for course in courses:
        # Get department name
        department = db.query(models.Department).filter(
            models.Department.department_id == course.department_id
        ).first()
        department_name = department.name if department else "Unknown"
        
        # Get enrollment count
        enrollment_count = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == course.course_id,
            models.CourseEnrollment.status == "Active"
        ).count()
        
        result.append(CourseWithEnrollments(
            course_id=course.course_id,
            title=course.title,
            description=course.description,
            code=course.code,
            credits=course.credits,
            department_id=course.department_id,
            created_by=course.created_by,
            is_active=course.is_active,
            created_at=course.created_at,
            enrollment_count=enrollment_count,
            department_name=department_name
        ))
    
    return result

@router.get(
    "/courses/{course_id}",
    response_model=CourseCreateResponse,
    summary="Get course details by ID"
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return CourseCreateResponse(
        course_id=course.course_id,
        title=course.title,
        description=course.description,
        code=course.code,
        credits=course.credits,
        department_id=course.department_id,
        created_by=course.created_by,
        is_active=course.is_active,
        created_at=course.created_at
    )

@router.put(
    "/courses/{course_id}",
    response_model=CourseCreateResponse,
    summary="Update course details (doctor only)"
)
def update_course(
    course_id: int,
    course_data: CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    # Get existing course
    course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Validate department exists
    department = db.query(models.Department).filter(
        models.Department.department_id == course_data.department_id
    ).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if course code already exists (excluding current course)
    existing_course = db.query(models.Course).filter(
        models.Course.code == course_data.code,
        models.Course.course_id != course_id
    ).first()
    
    if existing_course:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    # Update course
    try:
        course.title = course_data.title
        course.description = course_data.description
        course.code = course_data.code
        course.credits = course_data.credits
        course.department_id = course_data.department_id
        
        db.commit()
        db.refresh(course)
        
        return CourseCreateResponse(
            course_id=course.course_id,
            title=course.title,
            description=course.description,
            code=course.code,
            credits=course.credits,
            department_id=course.department_id,
            created_by=course.created_by,
            is_active=course.is_active,
            created_at=course.created_at
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update course. Please check your input.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/courses/{course_id}/assignments",
    response_model=List[CourseResponse],
    summary="Get assignments for a specific course"
)
def get_course_assignments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get all assignments for a specific course"""
    
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get assignments for this course (assuming assignments are linked by department for now)
    # In a more complete system, you'd have a direct course_id field in assignments
    assignments = db.query(models.Assignment).filter(
        models.Assignment.department_id == course.department_id
    ).order_by(models.Assignment.created_at.desc()).all()
    
    return [
        CourseResponse(
            assignment_id=assignment.assignment_id,
            title=assignment.title,
            description=assignment.description,
            type_id=assignment.type_id,
            department_id=assignment.department_id,
            target_year=assignment.target_year,
            deadline=assignment.deadline,
            max_grade=assignment.max_grade,
            created_by=assignment.created_by,
            created_at=assignment.created_at
        )
        for assignment in assignments
    ]

# Course Enrollment Models for self-enrollment
class SelfEnrollmentCreate(BaseModel):
    course_id: int = Field(..., description="Course ID to enroll in")

# Course Enrollment Endpoints
@router.post(
    "/enrollments/self",
    response_model=CourseEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Self-enroll in course (student only)"
)
def self_enroll_in_course(
    enrollment_data: SelfEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Allow students to enroll themselves in a course"""
    
    # Only students can self-enroll
    if (current_user.role or "").lower() != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can self-enroll in courses")
    
    # Get student record for current user
    print(f"[DEBUG] Self-enrollment: Looking for student with user_id: {current_user.id}")
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        print(f"[DEBUG] Self-enrollment: No student record found for user_id: {current_user.id}")
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    print(f"[DEBUG] Self-enrollment: Found student_id: {student.student_id} for user_id: {current_user.id}")
    
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.course_id == enrollment_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if course is active
    if not course.is_active:
        raise HTTPException(status_code=400, detail="Course is not currently active for enrollment")
    
    # Check if already enrolled
    existing_enrollment = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.course_id == enrollment_data.course_id,
        models.CourseEnrollment.student_id == student.student_id,
        models.CourseEnrollment.status == "Active"
    ).first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")
    
    # Create enrollment
    try:
        print(f"[DEBUG] Self-enrollment: Creating enrollment for student_id: {student.student_id}, course_id: {enrollment_data.course_id}")
        enrollment = models.CourseEnrollment(
            course_id=enrollment_data.course_id,
            student_id=student.student_id,
            status="Active",
            enrolled_at=datetime.utcnow()
        )
        
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        
        print(f"[DEBUG] Self-enrollment: Successfully created enrollment_id: {enrollment.enrollment_id}")
        
        # Get department name
        department = db.query(models.Department).filter(
            models.Department.department_id == course.department_id
        ).first()
        department_name = department.name if department else "Unknown"
        
        return CourseEnrollmentResponse(
            enrollment_id=enrollment.enrollment_id,
            course_id=enrollment.course_id,
            student_id=enrollment.student_id,
            enrolled_at=enrollment.enrolled_at,
            status=enrollment.status,
            grade=enrollment.grade,
            notes=enrollment.notes,
            course_title=course.title,
            course_code=course.code,
            course_credits=course.credits,
            department_name=department_name
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to enroll in course")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post(
    "/enrollments",
    response_model=CourseEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll student in course (admin/doctor only)"
)
def enroll_student(
    enrollment_data: CourseEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Enroll a student in a course (admin/doctor functionality)"""
    
    # Only doctors and admins can enroll other students
    _require_doctor(current_user)
    
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.course_id == enrollment_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if student exists
    student = db.query(models.Student).filter(models.Student.student_id == enrollment_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if already enrolled
    existing_enrollment = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.course_id == enrollment_data.course_id,
        models.CourseEnrollment.student_id == enrollment_data.student_id,
        models.CourseEnrollment.status == "Active"
    ).first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course")
    
    # Create enrollment
    try:
        enrollment = models.CourseEnrollment(
            course_id=enrollment_data.course_id,
            student_id=enrollment_data.student_id,
            status="Active",
            enrolled_at=datetime.utcnow()
        )
        
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        
        # Get department name
        department = db.query(models.Department).filter(
            models.Department.department_id == course.department_id
        ).first()
        department_name = department.name if department else "Unknown"
        
        return CourseEnrollmentResponse(
            enrollment_id=enrollment.enrollment_id,
            course_id=enrollment.course_id,
            student_id=enrollment.student_id,
            enrolled_at=enrollment.enrolled_at,
            status=enrollment.status,
            grade=enrollment.grade,
            notes=enrollment.notes,
            course_title=course.title,
            course_code=course.code,
            course_credits=course.credits,
            department_name=department_name
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to enroll student")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/enrollments/student/{student_id}",
    response_model=List[CourseEnrollmentResponse],
    summary="Get student's course enrollments"
)
def get_student_enrollments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get all course enrollments for a student"""
    
    # Allow doctors/admins to view any student's enrollments
    # Allow students to view only their own enrollments
    if (current_user.role or "").lower() == "student":
        # Students can only view their own enrollments
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or student.student_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif (current_user.role or "").lower() not in {"doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    print(f"[DEBUG] Looking for enrollments for student_id: {student_id}")
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.student_id == student_id
    ).all()
    
    print(f"[DEBUG] Found {len(enrollments)} enrollments for student_id {student_id}")
    for enrollment in enrollments:
        print(f"[DEBUG] Enrollment: {enrollment.enrollment_id}, course_id: {enrollment.course_id}, status: {enrollment.status}")
    
    result = []
    for enrollment in enrollments:
        # Get course details
        course = db.query(models.Course).filter(models.Course.course_id == enrollment.course_id).first()
        if not course:
            continue
            
        # Get department name
        department = db.query(models.Department).filter(
            models.Department.department_id == course.department_id
        ).first()
        department_name = department.name if department else "Unknown"
        
        result.append(CourseEnrollmentResponse(
            enrollment_id=enrollment.enrollment_id,
            course_id=enrollment.course_id,
            student_id=enrollment.student_id,
            enrolled_at=enrollment.enrolled_at,
            status=enrollment.status,
            grade=enrollment.grade,
            notes=enrollment.notes,
            course_title=course.title,
            course_code=course.code,
            course_credits=course.credits,
            department_name=department_name
        ))
    
    return result

@router.get(
    "/enrollments/course/{course_id}",
    response_model=List[CourseEnrollmentResponse],
    summary="Get course enrollments"
)
def get_course_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Get all enrollments for a course"""
    
    enrollments = db.query(models.CourseEnrollment).filter(
        models.CourseEnrollment.course_id == course_id
    ).all()
    
    result = []
    for enrollment in enrollments:
        # Get course details
        course = db.query(models.Course).filter(models.Course.course_id == enrollment.course_id).first()
        if not course:
            continue
            
        # Get department name
        department = db.query(models.Department).filter(
            models.Department.department_id == course.department_id
        ).first()
        department_name = department.name if department else "Unknown"
        
        result.append(CourseEnrollmentResponse(
            enrollment_id=enrollment.enrollment_id,
            course_id=enrollment.course_id,
            student_id=enrollment.student_id,
            enrolled_at=enrollment.enrolled_at,
            status=enrollment.status,
            grade=enrollment.grade,
            notes=enrollment.notes,
            course_title=course.title,
            course_code=course.code,
            course_credits=course.credits,
            department_name=department_name
        ))
    
    return result
