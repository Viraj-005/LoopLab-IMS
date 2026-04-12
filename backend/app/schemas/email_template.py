"""
Email Template Schemas
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.email_template import TemplateTone, TemplateType


class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    tone: TemplateTone = TemplateTone.FORMAL
    template_type: TemplateType = TemplateType.CUSTOM
    auto_send_enabled: bool = False


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    tone: Optional[TemplateTone] = None
    template_type: Optional[TemplateType] = None
    auto_send_enabled: Optional[bool] = None


class EmailTemplate(EmailTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
