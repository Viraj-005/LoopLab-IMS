"""
System Settings Model
Stores global organization settings, security toggles, and defaults
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemSettings(Base):
    """Global system settings - single row table"""
    __tablename__ = "system_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    
    # Organization Details
    org_name: Mapped[str] = mapped_column(String(255), default="LOOPLAB")
    contact_email: Mapped[str] = mapped_column(String(255), default="hr@looplab.io")
    website: Mapped[str] = mapped_column(String(255), default="https://looplab.io")
    
    # Notification Toggles
    notify_new_applications: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_duplicate_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_spam_alerts: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_status_changes: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Security / Logic Toggles
    enable_spam_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_duplicate_detection: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<SystemSettings updated={self.updated_at}>"
