import aiosmtplib
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any, List
from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.config import get_settings
from app.models.email_template import EmailTemplate, TemplateType
from app.models.application import Application
from app.models.timeline import ActionType, PerformerType
from app.services.timeline_service import add_timeline_entry

settings = get_settings()

class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email
        
    def stamp_subject(self, subject: str, application_id: Any) -> str:
        """Append [Ref: ID] to the subject line for smart tracking"""
        if not application_id:
            return subject
        short_id = str(application_id)[:8].upper()
        ref_tag = f"[Ref: {short_id}]"
        if ref_tag not in subject:
            return f"{subject} {ref_tag}"
        return subject

    async def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        """Send email using asynchronous SMTP"""
        if not self.smtp_user or not self.smtp_password:
            print("WARNING: SMTP configuration missing. Email not sent.")
            return False
            
        # Create message
        message = MIMEMultipart()
        message["From"] = self.from_email
        message["To"] = to_email
        message["Subject"] = subject
        
        # Convert plain newlines to HTML breaks if no basic HTML tags are used
        lower_body = html_body.lower()
        if "<p" not in lower_body and "<br" not in lower_body and "<div" not in lower_body:
            html_body = html_body.replace("\n", "<br>")
            html_body = f'<div style="font-family: system-ui, -apple-system, sans-serif; color: #333; line-height: 1.6;">{html_body}</div>'
            
        message.attach(MIMEText(html_body, "html"))

        try:
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True if self.smtp_port == 587 else False,
                use_tls=True if self.smtp_port == 465 else False,
            )
            print(f"INFO: Email successfully dispatched to {to_email} via SMTP")
            return True
        except Exception as e:
            print(f"ERROR: SMTP dispatch failure: {e}")
            return False

    async def send_template_email(
        self, 
        db: AsyncSession, 
        application: Application, 
        template_type: TemplateType,
        **extra_variables
    ) -> bool:
        """
        Find active template for the type and send it
        """
        # Find active template of this type
        query = select(EmailTemplate).where(
            and_(
                EmailTemplate.template_type == template_type,
                EmailTemplate.auto_send_enabled == True
            )
        )
        # If multiple, take the first one (or filter by tone if we had logic for that)
        result = await db.execute(query)
        template = result.scalars().first()
        
        if not template:
            return False
            
        # Render
        variables = {
            "applicant_name": application.applicant_name or "Applicant",
            "applied_role": application.applied_role or "Internship",
            "company_name": settings.company_name,
            "interview_time": application.interview_time or "",
            "interview_venue": application.interview_venue or "",
            **extra_variables
        }
        subject, body = template.render(**variables)
        
        # Add Smart Reference ID to Subject
        subject = self.stamp_subject(subject, application.id)
        
        # Send
        success = await self.send_email(application.email, subject, body)
        
        if success:
            await add_timeline_entry(
                db, 
                application.id, 
                ActionType.EMAIL_SENT, 
                f"Sent auto-reply: {template.name}",
                performer_type=PerformerType.SYSTEM
            )
            
        return success

email_service = EmailService()
