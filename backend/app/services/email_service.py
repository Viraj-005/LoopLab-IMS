"""
Email Service
Handles sending emails via Mailgun
"""
import httpx
from typing import Optional, Dict, Any, List
from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.models.email_template import EmailTemplate, TemplateType
from app.models.application import Application
from app.models.timeline import ActionType, PerformerType
from app.services.timeline_service import add_timeline_entry

settings = get_settings()

class EmailService:
    def __init__(self):
        self.api_key = settings.mailgun_api_key
        self.domain = settings.mailgun_domain
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
        self.from_email = settings.mailgun_from_email

    async def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        """Send email using Mailgun API"""
        if not self.api_key or not self.domain:
            print("WARNING: Mailgun configuration missing. Email not sent.")
            return False
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/messages",
                    auth=("api", self.api_key),
                    data={
                        "from": self.from_email,
                        "to": to_email,
                        "subject": subject,
                        "html": html_body
                    }
                )
                response.raise_for_status()
                return True
            except Exception as e:
                print(f"Error sending email: {e}")
                return False

    async def send_template_email(
        self, 
        db: AsyncSession, 
        application: Application, 
        template_type: TemplateType
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
            "company_name": settings.company_name
        }
        subject, body = template.render(**variables)
        
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
