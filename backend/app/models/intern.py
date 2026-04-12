"""
Intern Model - Applicant users who log in via Google OAuth
"""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SQLEnum, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class OAuthProvider(str, enum.Enum):
    GOOGLE = "google"


class Intern(Base):
    """Intern (applicant) model — Google OAuth auth only"""
    __tablename__ = "interns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # OAuth identity
    oauth_provider: Mapped[OAuthProvider] = mapped_column(
        SQLEnum(OAuthProvider), nullable=False
    )
    oauth_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Core identity
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_picture_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Profile details (filled after OAuth login)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    university: Mapped[str] = mapped_column(String(255), nullable=True)
    graduation_year: Mapped[int] = mapped_column(nullable=True)
    gpa: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)

    # Advanced Profile (JSON Lists)
    education_history: Mapped[list] = mapped_column(JSON, default=list, server_default='[]')
    work_experience: Mapped[list] = mapped_column(JSON, default=list, server_default='[]')

    # Social links
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    github_url: Mapped[str] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Profile state
    profile_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Auth
    refresh_token_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    applications = relationship(
        "Application", back_populates="intern", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Intern {self.email}>"
