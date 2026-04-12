"""
System Settings Schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, HttpUrl, ConfigDict
from datetime import datetime


class SystemSettingsBase(BaseModel):
    org_name: str = "LOOPLAB"
    contact_email: EmailStr = "hr@looplab.io"
    website: str = "https://looplab.io"
    
    notify_new_applications: bool = True
    notify_duplicate_detection: bool = True
    notify_spam_alerts: bool = False
    notify_status_changes: bool = True
    
    enable_spam_detection: bool = True
    enable_duplicate_detection: bool = True


class SystemSettingsUpdate(BaseModel):
    org_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    website: Optional[str] = None
    
    notify_new_applications: Optional[bool] = None
    notify_duplicate_detection: Optional[bool] = None
    notify_spam_alerts: Optional[bool] = None
    notify_status_changes: Optional[bool] = None
    
    enable_spam_detection: Optional[bool] = None
    enable_duplicate_detection: Optional[bool] = None


class SystemSettings(SystemSettingsBase):
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
