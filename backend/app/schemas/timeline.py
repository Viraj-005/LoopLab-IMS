"""
Timeline Schemas
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.timeline import ActionType, PerformerType


class TimelineBase(BaseModel):
    action_type: ActionType
    description: str
    performed_by: Optional[str] = None
    performer_type: PerformerType = PerformerType.SYSTEM


class TimelineCreate(TimelineBase):
    application_id: UUID


class ApplicationTimeline(TimelineBase):
    id: UUID
    application_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
