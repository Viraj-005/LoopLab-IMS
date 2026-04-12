"""
Job Post Model - Internal job board for interns
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base

class JobStatus(str, enum.Enum):
    DRAFT = "Draft"
    LIVE = "Live"
    CLOSED = "Closed"

class JobCategory(str, enum.Enum):
    ENGINEERING = "Software Engineering"
    AI_RESEARCH = "AI Research"
    DESIGN = "UX/UI Design"
    OPERATIONS = "Operations"
    MARKETING = "Marketing"

class JobPost(Base):
    """Job Post model for internal intern openings"""
    __tablename__ = "job_posts"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(100),
        default=JobCategory.ENGINEERING.value,
        nullable=False
    )
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus),
        default=JobStatus.DRAFT,
        nullable=False,
        index=True
    )
    
    description: Mapped[str] = mapped_column(Text, nullable=True) # Rich text or markdown
    requirements: Mapped[str] = mapped_column(Text, nullable=True)
    
    location: Mapped[str] = mapped_column(String(100), default="Remote") # Remote, Hybrid, On-site
    stipend_range: Mapped[str] = mapped_column(String(100), nullable=True)
    capacity: Mapped[int] = mapped_column(default=1)
    tags: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    media_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = relationship("Application", back_populates="job_post")

    def __repr__(self) -> str:
        return f"<JobPost {self.title} - {self.status}>"
