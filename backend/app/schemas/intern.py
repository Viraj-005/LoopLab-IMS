"""
Intern Schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, HttpUrl
from uuid import UUID
from datetime import datetime
from app.models.intern import OAuthProvider


class InternBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None


class EducationEntry(BaseModel):
    school: str
    degree: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    graduation_month: Optional[int] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = None

class ExperienceEntry(BaseModel):
    company: str
    position: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_current: bool = False

class InternProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    education_history: Optional[list[EducationEntry]] = None
    work_experience: Optional[list[ExperienceEntry]] = None


class Intern(InternBase):
    id: UUID
    oauth_provider: OAuthProvider
    phone: Optional[str] = None
    bio: Optional[str] = None
    education_history: list[EducationEntry] = []
    work_experience: list[ExperienceEntry] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_complete: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InternToken(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    intern: Intern
