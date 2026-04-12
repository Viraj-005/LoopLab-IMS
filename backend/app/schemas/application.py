"""
Application Schemas
"""
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.application import ApplicationStatus, ApplicationSource
from app.schemas.timeline import ApplicationTimeline
from app.schemas.job_post import JobPost


class ApplicationBase(BaseModel):
    applicant_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    applied_role: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    source: Optional[ApplicationSource] = ApplicationSource.MANUAL
    job_id: Optional[UUID] = None
    intern_id: Optional[UUID] = None


class ApplicationCreate(ApplicationBase):
    # Additional fields created during ingestion
    cv_file_path: Optional[str] = None
    cv_hash: Optional[str] = None
    cv_original_filename: Optional[str] = None
    cover_letter_path: Optional[str] = None
    cover_letter_original_filename: Optional[str] = None
    received_at: Optional[datetime] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    internal_notes: Optional[str] = None
    # Flags can be manually cleared/set
    duplicate_flag: Optional[bool] = None
    spam_flag: Optional[bool] = None
    applicant_name: Optional[str] = None
    applied_role: Optional[str] = None


class Application(ApplicationBase):
    id: UUID
    cv_file_path: Optional[str] = None
    cv_original_filename: Optional[str] = None
    cover_letter_path: Optional[str] = None
    cover_letter_original_filename: Optional[str] = None
    status: ApplicationStatus
    duplicate_flag: bool
    duplicate_reason: Optional[str] = None
    spam_flag: bool
    spam_reason: Optional[str] = None
    internal_notes: Optional[str] = None
    source: ApplicationSource
    job_id: Optional[UUID] = None
    intern_id: Optional[UUID] = None
    received_at: datetime
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ApplicationDetail(Application):
    # Timeline is heavy and handled in detail view
    timeline: List[ApplicationTimeline] = []

    model_config = ConfigDict(from_attributes=True)


class InternApplicationDetail(Application):
    job_post: Optional[JobPost] = None
    timeline: List[ApplicationTimeline] = []

    model_config = ConfigDict(from_attributes=True)


class ApplicationNoteCreate(BaseModel):
    note: str


class ApplicationEmailSend(BaseModel):
    subject: str
    body: str


class ApplicationList(BaseModel):
    items: List[Application]
    total: int
    page: int
    size: int
    
    model_config = ConfigDict(from_attributes=True)
