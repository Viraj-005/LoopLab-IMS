"""
Application Timeline Model - Event history tracking
"""
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class ActionType(str, enum.Enum):
    """Types of actions that can be tracked"""
    APPLICATION_RECEIVED = "application_received"
    STATUS_CHANGED = "status_changed"
    NOTE_ADDED = "note_added"
    EMAIL_SENT = "email_sent"
    DUPLICATE_DETECTED = "duplicate_detected"
    SPAM_DETECTED = "spam_detected"
    DUPLICATE_CLEARED = "duplicate_cleared"
    SPAM_CLEARED = "spam_cleared"
    BULK_ACTION = "bulk_action"
    CV_DOWNLOADED = "cv_downloaded"


class PerformerType(str, enum.Enum):
    """Who performed the action"""
    SYSTEM = "System"
    ADMIN = "Admin"


class ApplicationTimeline(Base):
    """Timeline entry for application events"""
    __tablename__ = "application_timeline"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    action_type: Mapped[ActionType] = mapped_column(
        SQLEnum(ActionType),
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    performed_by: Mapped[str] = mapped_column(
        String(255),
        nullable=True  # System actions may not have a user
    )
    performer_type: Mapped[PerformerType] = mapped_column(
        SQLEnum(PerformerType),
        default=PerformerType.SYSTEM,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    
    # Relationships
    application = relationship(
        "Application",
        back_populates="timeline"
    )
    
    def __repr__(self) -> str:
        return f"<Timeline {self.action_type} - {self.created_at}>"
