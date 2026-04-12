"""
User Schemas (Staff)
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
from app.utils.security import is_password_strong


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.HR
    is_active: bool = True


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        if not is_password_strong(v):
            raise ValueError('Password must be at least 8 characters long and contain at least one uppercase letter and one number')
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_must_be_strong(cls, v: Optional[str]) -> Optional[str]:
        if v and not is_password_strong(v):
            raise ValueError('Password must be at least 8 characters long and contain at least one uppercase letter and one number')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: UUID
    last_login: Optional[datetime] = None
    locked_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User


class TokenData(BaseModel):
    id: Optional[UUID] = None
    email: Optional[str] = None
    user_type: Optional[str] = None
