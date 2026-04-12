from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    subject: str
    body: str

class NotificationCreate(NotificationBase):
    intern_id: UUID
    application_id: Optional[UUID] = None

class Notification(NotificationBase):
    id: UUID
    intern_id: UUID
    application_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
