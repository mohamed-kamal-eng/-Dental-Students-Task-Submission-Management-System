from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, Float, Text, DateTime, String, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

# -------- users --------
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="student")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    role_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

# -------- master data --------
class Department(Base):
    __tablename__ = "Department"
    department_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name:         Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description:  Mapped[Optional[str]] = mapped_column(Text)
    is_active:    Mapped[bool] = mapped_column(Integer, nullable=False, default=1)  # SQLite uses 0/1 for boolean
    created_at:   Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    updated_at:   Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    assignments: Mapped[List["Assignment"]] = relationship("Assignment", back_populates="department")

class AssignmentType(Base):
    __tablename__ = "AssignmentType"
    type_id:            Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name:               Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description:        Mapped[Optional[str]] = mapped_column(Text)
    allowed_file_types: Mapped[str] = mapped_column(Text, nullable=False)
    is_active:          Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    # Relationships
    assignments: Mapped[List["Assignment"]] = relationship("Assignment", back_populates="assignment_type")

class Course(Base):
    __tablename__ = "Course"
    course_id:      Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title:          Mapped[str] = mapped_column(Text, nullable=False)
    description:    Mapped[Optional[str]] = mapped_column(Text)
    code:           Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    credits:        Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    department_id:  Mapped[int] = mapped_column(Integer, nullable=False)
    created_by:     Mapped[int] = mapped_column(Integer, nullable=False)  # Doctor.doctor_id
    is_active:      Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at:     Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    
    # Relationships
    enrollments: Mapped[List["CourseEnrollment"]] = relationship("CourseEnrollment", back_populates="course")

class CourseEnrollment(Base):
    __tablename__ = "CourseEnrollment"
    enrollment_id:  Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id:      Mapped[int] = mapped_column(Integer, ForeignKey("Course.course_id"), nullable=False)
    student_id:     Mapped[int] = mapped_column(Integer, nullable=False)  # Student.student_id
    enrolled_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    status:         Mapped[str] = mapped_column(Text, nullable=False, default="Active")  # Active, Dropped, Completed
    grade:          Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes:          Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")

class Assignment(Base):
    __tablename__ = "Assignment"
    assignment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title:         Mapped[str] = mapped_column(Text, nullable=False)
    description:   Mapped[Optional[str]] = mapped_column(Text)
    type_id:       Mapped[int] = mapped_column(Integer, ForeignKey("AssignmentType.type_id"), nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("Department.department_id"), nullable=False)
    created_by:    Mapped[int] = mapped_column(Integer, ForeignKey("Doctor.doctor_id"), nullable=False)
    target_year:   Mapped[str] = mapped_column(Text, nullable=False, default="All")
    deadline:      Mapped[datetime] = mapped_column(DateTime, nullable=False)
    max_grade:     Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    max_file_size_mb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=20)
    instructions:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active:     Mapped[bool] = mapped_column(Integer, nullable=False, default=1)  # SQLite uses 0/1 for boolean
    created_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    updated_at:    Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    assignment_type: Mapped["AssignmentType"] = relationship("AssignmentType", back_populates="assignments")
    department: Mapped["Department"] = relationship("Department", back_populates="assignments")
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="assignments")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="assignment")

# -------- people --------
class Student(Base):
    __tablename__ = "Student"
    student_id:     Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_number: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    full_name:      Mapped[str] = mapped_column(Text, nullable=False)
    email:          Mapped[Optional[str]] = mapped_column(Text)
    phone:          Mapped[Optional[str]] = mapped_column(Text)
    year_level:     Mapped[str] = mapped_column(Text, nullable=False, default="Fourth")
    status:         Mapped[str] = mapped_column(Text, nullable=False, default="Active")
    graduation_year:Mapped[Optional[int]] = mapped_column(Integer)
    current_status: Mapped[Optional[str]] = mapped_column(Text)
    notes:          Mapped[Optional[str]] = mapped_column(Text)
    created_at:     Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    user_id:        Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # New fields for enhanced student profile
    gpa:            Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    date_of_birth:  Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    nationality:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact_relationship: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Doctor(Base):
    __tablename__ = "Doctor"
    doctor_id:     Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name:     Mapped[str] = mapped_column(Text, nullable=False)
    email:         Mapped[Optional[str]] = mapped_column(Text, unique=True)
    role:          Mapped[str] = mapped_column(Text, nullable=False, default="Lecturer")
    department_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    user_id:       Mapped[int] = mapped_column(Integer, unique=True)
    
    # Relationships
    assignments: Mapped[List["Assignment"]] = relationship("Assignment", back_populates="doctor")

# -------- submissions --------
class Submission(Base):
    __tablename__ = "Submission"
    submission_id:     Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assignment_id:     Mapped[int] = mapped_column(Integer, ForeignKey("Assignment.assignment_id"), nullable=False)
    student_id:        Mapped[int] = mapped_column(Integer, nullable=False)
    original_filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_path:         Mapped[str] = mapped_column(Text, nullable=False)
    file_type:         Mapped[str] = mapped_column(Text, nullable=False, default="Other")
    submitted_at:      Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    status:            Mapped[str] = mapped_column(Text, nullable=False, default="Pending")
    student_notes:     Mapped[Optional[str]] = mapped_column(Text)
    mime_type:         Mapped[Optional[str]] = mapped_column(Text)
    file_size:         Mapped[Optional[int]] = mapped_column(Integer)
    
    # Relationships
    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="submissions")
    feedback: Mapped[List["SubmissionFeedback"]] = relationship("SubmissionFeedback", back_populates="submission")

class SubmissionFeedback(Base):
    __tablename__ = "SubmissionFeedback"
    feedback_id:   Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    submission_id: Mapped[int] = mapped_column(Integer, ForeignKey("Submission.submission_id"), nullable=False, unique=True)
    doctor_id:     Mapped[int] = mapped_column(Integer, nullable=False)
    feedback_text: Mapped[Optional[str]] = mapped_column(Text)
    grade:         Mapped[Optional[float]] = mapped_column(Float)
    created_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    
    # Relationships
    submission: Mapped["Submission"] = relationship("Submission", back_populates="feedback")

class Announcement(Base):
    __tablename__ = "Announcement"
    id:              Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title:           Mapped[str] = mapped_column(Text, nullable=False)
    message:         Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(Text, nullable=False, default="all")
    priority:        Mapped[str] = mapped_column(Text, nullable=False, default="normal")
    scheduled_for:   Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    sent_at:         Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
    status:          Mapped[str] = mapped_column(Text, nullable=False, default="sent")
    created_by:      Mapped[int] = mapped_column(Integer, nullable=False)  # Doctor.doctor_id
    created_at:      Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), nullable=False)
