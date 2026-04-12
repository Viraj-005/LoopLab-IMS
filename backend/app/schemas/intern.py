"""
Intern Schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, HttpUrl
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.intern import OAuthProvider


class InternBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None


class InternProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[Decimal] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class Intern(InternBase):
    id: UUID
    oauth_provider: OAuthProvider
    phone: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[Decimal] = None
    bio: Optional[str] = None
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
