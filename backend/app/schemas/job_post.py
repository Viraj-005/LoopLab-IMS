"""
Job Post Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.job_post import JobStatus, JobCategory


class JobPostBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = "Remote"
    stipend_range: Optional[str] = None
    capacity: Optional[int] = 1
    tags: Optional[str] = None
    status: Optional[JobStatus] = JobStatus.DRAFT
    media_url: Optional[str] = None


class JobPostCreate(JobPostBase):
    pass


class JobPostUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    stipend_range: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[JobStatus] = None
    media_url: Optional[str] = None


class JobPost(JobPostBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    application_count: int = 0
    applied: bool = False

    model_config = ConfigDict(from_attributes=True)


class JobPostList(BaseModel):
    items: List[JobPost]
    total: int
    
    model_config = ConfigDict(from_attributes=True)
