"""
Application Model - Intern application records
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    """Status of an intern application"""
    NEW = "New"
    PENDING = "Pending"
    SELECTED = "Selected"
    REJECTED = "Rejected"


class ApplicationSource(str, enum.Enum):
    """Source of an intern application"""
    PORTAL = "portal"
    EMAIL = "email"
    MANUAL = "manual"


class Application(Base):
    """Application model for intern applications"""
    __tablename__ = "applications"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Source Tracking
    source: Mapped[ApplicationSource] = mapped_column(
        SQLEnum(ApplicationSource),
        default=ApplicationSource.MANUAL,
        nullable=False,
        index=True
    )
    
    # Applicant Information
    applicant_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    phone: Mapped[str] = mapped_column(
        String(50),
        nullable=True
    )
    applied_role: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    # CV/Resume Information
    cv_file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    cv_hash: Mapped[str] = mapped_column(
        String(64),  # SHA-256 hash
        nullable=True,
        index=True
    )
    cv_original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    
    # Status
    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus),
        default=ApplicationStatus.NEW,
        nullable=False,
        index=True
    )
    
    # Duplicate Detection
    duplicate_flag: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )
    duplicate_reason: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    # Spam Detection
    spam_flag: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )
    spam_reason: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    
    # Email Content
    email_subject: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    email_body: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )
    
    # Internal Notes
    internal_notes: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )
    
    # Associated Job
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_posts.id"),
        nullable=True,
        index=True
    )

    # Intern who submitted this application (NULL for webhook/external submissions)
    intern_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interns.id"),
        nullable=True,
        index=True
    )

    # Cover letter (optional, for jobs that require it)
    cover_letter_path: Mapped[str] = mapped_column(String(500), nullable=True)
    cover_letter_original_filename: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Interview Scheduling
    interview_time: Mapped[str] = mapped_column(String(255), nullable=True)
    interview_venue: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    received_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    timeline = relationship(
        "ApplicationTimeline",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationTimeline.created_at.desc()"
    )
    
    job_post = relationship("JobPost", back_populates="applications")
    intern = relationship("Intern", back_populates="applications")
    
    def __repr__(self) -> str:
        return f"<Application {self.email} - Job: {self.job_id}>"
