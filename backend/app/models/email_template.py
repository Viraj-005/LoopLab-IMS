"""
Email Template Model - Templates for auto-replies
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.database import Base


class TemplateTone(str, enum.Enum):
    """Tone variants for email templates"""
    FORMAL = "formal"
    FRIENDLY = "friendly"


class TemplateType(str, enum.Enum):
    """Types of email templates"""
    APPLICATION_RECEIVED = "application_received"
    INTERVIEW_INVITATION = "interview_invitation"
    SELECTED = "selected"
    REJECTED = "rejected"
    OFFER_DECLINED = "offer_declined"
    TERMINATED = "terminated"
    CUSTOM = "custom"


class EmailTemplate(Base):
    """Email template for applicant communications"""
    __tablename__ = "email_templates"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    subject: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    body: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    tone: Mapped[TemplateTone] = mapped_column(
        SQLEnum(TemplateTone),
        default=TemplateTone.FORMAL,
        nullable=False
    )
    template_type: Mapped[TemplateType] = mapped_column(
        SQLEnum(TemplateType),
        default=TemplateType.CUSTOM,
        nullable=False
    )
    auto_send_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
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
    
    def __repr__(self) -> str:
        return f"<EmailTemplate {self.name}>"
    
    def render(self, **variables) -> tuple[str, str]:
        """
        Render the template with variables.
        
        Available variables:
        - {applicant_name}
        - {applied_role}
        - {company_name}
        
        Returns: (rendered_subject, rendered_body)
        """
        subject = self.subject
        body = self.body
        
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
        
        return subject, body
