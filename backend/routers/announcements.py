# routers/announcements.py
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

router = APIRouter(prefix="/announcements", tags=["announcements"])

# ---- Pydantic models --------------------------------------------------------

class AnnouncementCreate(BaseModel):
    title: str = Field(..., description="Announcement title")
    message: str = Field(..., description="Announcement message")
    target_audience: str = Field("all", description="Target audience")
    priority: str = Field("normal", description="Priority level")
    scheduled_for: Optional[datetime] = Field(None, description="When to send the announcement")

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    target_audience: str
    priority: str
    scheduled_for: Optional[datetime]
    sent_at: datetime
    status: str

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    target_audience: Optional[str] = None
    priority: Optional[str] = None
    scheduled_for: Optional[datetime] = None


# ---- Helpers ----------------------------------------------------------------

def _require_doctor(user: models.User):
    if (user.role or "").lower() not in {"doctor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor or admin role required")

def _validate_target_audience(audience: str):
    valid_audiences = {"all", "first", "second", "third", "fourth", "fifth"}
    if audience not in valid_audiences:
        raise HTTPException(status_code=400, detail=f"Invalid target audience. Must be one of: {', '.join(valid_audiences)}")

def _validate_priority(priority: str):
    valid_priorities = {"low", "normal", "high", "urgent"}
    if priority not in valid_priorities:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")

# ---- Routes ----------------------------------------------------------------

@router.post(
    "/",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new announcement (doctor only)"
)
def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    # Validate input
    _validate_target_audience(announcement_data.target_audience)
    _validate_priority(announcement_data.priority)
    
    # Get doctor ID from current user
    doctor = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Create new announcement
    try:
        new_announcement = models.Announcement(
            title=announcement_data.title,
            message=announcement_data.message,
            target_audience=announcement_data.target_audience,
            priority=announcement_data.priority,
            scheduled_for=announcement_data.scheduled_for,
            sent_at=datetime.utcnow(),
            status="sent",
            created_by=doctor.doctor_id
        )
        
        db.add(new_announcement)
        db.commit()
        db.refresh(new_announcement)
        
        return AnnouncementResponse(
            id=new_announcement.id,
            title=new_announcement.title,
            message=new_announcement.message,
            target_audience=new_announcement.target_audience,
            priority=new_announcement.priority,
            scheduled_for=new_announcement.scheduled_for,
            sent_at=new_announcement.sent_at,
            status=new_announcement.status
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create announcement. Please check your input.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get(
    "/",
    response_model=List[AnnouncementResponse],
    summary="List all announcements (doctor only)"
)
def list_announcements(
    target_audience: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    query = db.query(models.Announcement)
    
    # Apply filters
    if target_audience:
        _validate_target_audience(target_audience)
        query = query.filter(models.Announcement.target_audience == target_audience)
    
    if priority:
        _validate_priority(priority)
        query = query.filter(models.Announcement.priority == priority)
    
    if status:
        query = query.filter(models.Announcement.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.Announcement.title.ilike(search_term) |
            models.Announcement.message.ilike(search_term)
        )
    
    # Apply pagination and ordering
    announcements = query.order_by(models.Announcement.sent_at.desc()).offset(offset).limit(limit).all()
    
    return [
        AnnouncementResponse(
            id=announcement.id,
            title=announcement.title,
            message=announcement.message,
            target_audience=announcement.target_audience,
            priority=announcement.priority,
            scheduled_for=announcement.scheduled_for,
            sent_at=announcement.sent_at,
            status=announcement.status
        )
        for announcement in announcements
    ]

@router.get(
    "/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Get announcement details by ID (doctor only)"
)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return AnnouncementResponse(
        id=announcement.id,
        title=announcement.title,
        message=announcement.message,
        target_audience=announcement.target_audience,
        priority=announcement.priority,
        scheduled_for=announcement.scheduled_for,
        sent_at=announcement.sent_at,
        status=announcement.status
    )

@router.put(
    "/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Update announcement (doctor only)"
)
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Validate input if provided
    if announcement_data.target_audience:
        _validate_target_audience(announcement_data.target_audience)
    
    if announcement_data.priority:
        _validate_priority(announcement_data.priority)
    
    # Update fields
    try:
        if announcement_data.title is not None:
            announcement.title = announcement_data.title
        if announcement_data.message is not None:
            announcement.message = announcement_data.message
        if announcement_data.target_audience is not None:
            announcement.target_audience = announcement_data.target_audience
        if announcement_data.priority is not None:
            announcement.priority = announcement_data.priority
        if announcement_data.scheduled_for is not None:
            announcement.scheduled_for = announcement_data.scheduled_for
        
        db.commit()
        db.refresh(announcement)
        
        return AnnouncementResponse(
            id=announcement.id,
            title=announcement.title,
            message=announcement.message,
            target_audience=announcement.target_audience,
            priority=announcement.priority,
            scheduled_for=announcement.scheduled_for,
            sent_at=announcement.sent_at,
            status=announcement.status
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update announcement. Please check your input.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete(
    "/{announcement_id}",
    summary="Delete announcement (doctor only)"
)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    _require_doctor(current_user)
    
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    try:
        db.delete(announcement)
        db.commit()
        return {"message": "Announcement deleted successfully"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

