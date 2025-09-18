# routers/student_management.py
from __future__ import annotations

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import io
import csv

from app.db import get_db
from app import models
from app.deps import get_current_active_user

router = APIRouter(prefix="/student-management", tags=["student-management"])

# ---- Pydantic models --------------------------------------------------------

class StudentCreate(BaseModel):
    student_number: str = Field(..., description="Unique student number")
    full_name: str = Field(..., description="Student's full name")
    email: Optional[str] = Field(None, description="Student's email address")
    phone: Optional[str] = Field(None, description="Student's phone number")
    year_level: str = Field("Fourth", description="Student's year level")
    status: str = Field("Active", description="Student status")
    graduation_year: Optional[int] = Field(None, description="Expected graduation year")
    notes: Optional[str] = Field(None, description="Additional notes")

class StudentUpdate(BaseModel):
    student_number: Optional[str] = Field(None, description="Unique student number")
    full_name: Optional[str] = Field(None, description="Student's full name")
    email: Optional[str] = Field(None, description="Student's email address")
    phone: Optional[str] = Field(None, description="Student's phone number")
    year_level: Optional[str] = Field(None, description="Student's year level")
    status: Optional[str] = Field(None, description="Student status")
    graduation_year: Optional[int] = Field(None, description="Expected graduation year")
    notes: Optional[str] = Field(None, description="Additional notes")

class StudentResponse(BaseModel):
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

class BulkImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: List[str]
    total_processed: int

# ---- Helpers ----------------------------------------------------------------

def _require_doctor(user: models.User):
    if (user.role or "").lower() not in {"doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor or admin role required")

def _validate_year_level(year_level: str):
    valid_levels = {"First", "Second", "Third", "Fourth", "Fifth"}
    if year_level not in valid_levels:
        raise HTTPException(status_code=400, detail=f"Invalid year level. Must be one of: {', '.join(valid_levels)}")

def _validate_status(status: str):
    valid_statuses = {"Active", "Inactive", "Graduated", "Suspended"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

# ---- Routes ----------------------------------------------------------------

@router.post(
    "/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student (doctor only)"
)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    # Validate input
    _validate_year_level(student_data.year_level)
    _validate_status(student_data.status)
    
    # Check if student number already exists
    existing_student = db.query(models.Student).filter(
        models.Student.student_number == student_data.student_number
    ).first()
    
    if existing_student:
        # Idempotent behavior: if student exists, try to auto-link to a User with same username, then return existing
        try:
            if getattr(existing_student, "user_id", None) in (None, 0):
                user = db.query(models.User).filter(models.User.username == existing_student.student_number).first()
                if user:
                    existing_student.user_id = user.id
                    db.commit()
                    db.refresh(existing_student)
        except Exception:
            db.rollback()
        return StudentResponse(
            student_id=existing_student.student_id,
            student_number=existing_student.student_number,
            full_name=existing_student.full_name,
            email=existing_student.email,
            phone=existing_student.phone,
            year_level=existing_student.year_level,
            status=existing_student.status,
            graduation_year=existing_student.graduation_year,
            notes=existing_student.notes,
            created_at=existing_student.created_at
        )
    
    # Create new student
    try:
        # If a User already exists with username == student_number, link it on create
        linked_user_id = None
        try:
            candidate_user = db.query(models.User).filter(models.User.username == student_data.student_number).first()
            if candidate_user:
                linked_user_id = candidate_user.id
        except Exception:
            linked_user_id = None

        new_student = models.Student(
            student_number=student_data.student_number,
            full_name=student_data.full_name,
            email=student_data.email,
            phone=student_data.phone,
            year_level=student_data.year_level,
            status=student_data.status,
            graduation_year=student_data.graduation_year,
            notes=student_data.notes,
            created_at=datetime.utcnow(),
            user_id=linked_user_id
        )
        
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        
        return StudentResponse(
            student_id=new_student.student_id,
            student_number=new_student.student_number,
            full_name=new_student.full_name,
            email=new_student.email,
            phone=new_student.phone,
            year_level=new_student.year_level,
            status=new_student.status,
            graduation_year=new_student.graduation_year,
            notes=new_student.notes,
            created_at=new_student.created_at
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create student. Please check your input.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/students",
    response_model=List[StudentResponse],
    summary="List all students (doctor only)"
)
def list_students(
    year_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    query = db.query(models.Student)
    
    # Apply filters
    if year_level:
        _validate_year_level(year_level)
        query = query.filter(models.Student.year_level == year_level)
    
    if status:
        _validate_status(status)
        query = query.filter(models.Student.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.Student.full_name.ilike(search_term) |
            models.Student.student_number.ilike(search_term) |
            models.Student.email.ilike(search_term)
        )
    
    # Apply pagination and ordering
    students = query.order_by(models.Student.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        StudentResponse(
            student_id=student.student_id,
            student_number=student.student_number,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            year_level=student.year_level,
            status=student.status,
            graduation_year=student.graduation_year,
            notes=student.notes,
            created_at=student.created_at
        )
        for student in students
    ]

@router.get(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Get student details by ID (doctor only)"
)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return StudentResponse(
        student_id=student.student_id,
        student_number=student.student_number,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        year_level=student.year_level,
        status=student.status,
        graduation_year=student.graduation_year,
        notes=student.notes,
        created_at=student.created_at
    )

@router.put(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Update student information (doctor only)"
)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update only provided fields
    update_data = student_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "year_level" and value:
            _validate_year_level(value)
        elif field == "status" and value:
            _validate_status(value)
        setattr(student, field, value)
    
    try:
        db.commit()
        db.refresh(student)
        
        return StudentResponse(
            student_id=student.student_id,
            student_number=student.student_number,
            full_name=student.full_name,
            email=student.email,
            phone=student.phone,
            year_level=student.year_level,
            status=student.status,
            graduation_year=student.graduation_year,
            notes=student.notes,
            created_at=student.created_at
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Student number already exists")

@router.delete(
    "/students/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete student (doctor only)"
)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        db.delete(student)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete student")

@router.post(
    "/students/bulk-import",
    response_model=BulkImportResponse,
    summary="Bulk import students from .txt file (doctor only)"
)
def bulk_import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Bulk import students from a .txt file.
    
    Expected format (tab-separated or comma-separated):
    student_number\tfull_name\temail\tphone\tyear_level\tstatus\tgraduation_year\tnotes
    
    Or one student per line with minimal info:
    student_number,full_name
    
    Example:
    DS2024001\tJohn Doe\tjohn.doe@dental.edu\t+1-555-0101\tFourth\tActive\t2024\tExcellent student
    DS2024002\tJane Smith\tjane.smith@dental.edu\t+1-555-0201\tFourth\tActive\t2024\tStrong academic performance
    """
    _require_doctor(current_user)
    
    # Validate file type
    if not file.filename or not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="File must be a .txt file")
    
    imported = 0
    skipped = 0
    errors = []
    total_processed = 0
    
    try:
        # Read file content
        content = file.file.read().decode('utf-8')
        lines = content.strip().split('\n')
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('#'):  # Skip empty lines and comments
                continue
                
            total_processed += 1
            
            try:
                # Try tab-separated first, then comma-separated
                if '\t' in line:
                    parts = line.split('\t')
                elif ',' in line:
                    parts = line.split(',')
                else:
                    # Single field - treat as student number only
                    parts = [line]
                
                # Clean up parts
                parts = [part.strip() for part in parts]
                
                # Parse fields based on your file format:
                # Column 0: Full Name
                # Column 1: Student ID  
                # Column 2: University Email
                # Column 3: Phone Number
                # Additional columns: year_level, status, graduation_year, notes
                
                if len(parts) < 2:
                    errors.append(f"Line {line_num}: Missing required fields (full name and student ID)")
                    continue
                
                full_name = parts[0] if parts[0] else f"Unknown Student"
                student_number = parts[1] if len(parts) > 1 and parts[1] else None
                email = parts[2] if len(parts) > 2 and parts[2] else None
                phone = parts[3] if len(parts) > 3 and parts[3] else None
                year_level = parts[4] if len(parts) > 4 and parts[4] else "Fourth"
                status = parts[5] if len(parts) > 5 and parts[5] else "Active"
                
                if not student_number:
                    errors.append(f"Line {line_num}: Missing student ID")
                    continue
                
                # Parse graduation year
                graduation_year = None
                if len(parts) > 6 and parts[6]:
                    try:
                        graduation_year = int(parts[6])
                    except ValueError:
                        errors.append(f"Line {line_num}: Invalid graduation year '{parts[6]}'")
                        continue
                
                notes = parts[7] if len(parts) > 7 and parts[7] else None
                
                # Validate year level and status
                try:
                    _validate_year_level(year_level)
                    _validate_status(status)
                except HTTPException as e:
                    errors.append(f"Line {line_num}: {e.detail}")
                    continue
                
                # Check if student already exists
                existing_student = db.query(models.Student).filter(
                    models.Student.student_number == student_number
                ).first()
                
                if existing_student:
                    skipped += 1
                    continue
                
                # Try to link to existing user
                linked_user_id = None
                try:
                    candidate_user = db.query(models.User).filter(
                        models.User.username == student_number
                    ).first()
                    if candidate_user:
                        linked_user_id = candidate_user.id
                except Exception:
                    pass
                
                # Create new student
                new_student = models.Student(
                    student_number=student_number,
                    full_name=full_name,
                    email=email,
                    phone=phone,
                    year_level=year_level,
                    status=status,
                    graduation_year=graduation_year,
                    notes=notes,
                    created_at=datetime.utcnow(),
                    user_id=linked_user_id
                )
                
                db.add(new_student)
                imported += 1
                
            except Exception as e:
                errors.append(f"Line {line_num}: {str(e)}")
                continue
        
        # Commit all changes
        if imported > 0:
            db.commit()
        
        return BulkImportResponse(
            imported=imported,
            skipped=skipped,
            errors=errors[:10],  # Limit errors to first 10
            total_processed=total_processed
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process file: {str(e)}"
        )
    finally:
        file.file.close()
