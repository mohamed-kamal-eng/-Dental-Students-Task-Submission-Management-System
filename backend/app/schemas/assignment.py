# backend/app/schemas/assignment.py
from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# READ (detailed)
class AssignmentRead(BaseModel):
    assignment_id: int
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None        # matches model.deadline
    type_id: Optional[int] = None              # FK -> AssignmentType.type_id
    department_id: Optional[int] = None        # FK -> Department.department_id
    max_file_size_mb: Optional[int] = None
    instructions: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    # convenient display fields
    type_name: Optional[str] = None
    department_name: Optional[str] = None
    submissions_count: int = 0

    class Config:
        from_attributes = True

# LIST / SUMMARY
class AssignmentSummary(BaseModel):
    assignment_id: int
    title: str
    deadline: Optional[datetime] = None
    type_name: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool = True
    submissions_count: int = 0

    class Config:
        from_attributes = True

# CREATE
class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime                             # required by your router
    type_id: int                                   # required FK
    department_id: int                             # required FK
    target_year: Optional[str] = "All"             # target year for assignment
    max_grade: Optional[float] = 100.0             # maximum grade for assignment
    max_file_size_mb: Optional[int] = None
    instructions: Optional[str] = None
    is_active: bool = True

# UPDATE (partial)
class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    type_id: Optional[int] = None
    department_id: Optional[int] = None
    target_year: Optional[str] = None
    max_grade: Optional[float] = None
    max_file_size_mb: Optional[int] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None
