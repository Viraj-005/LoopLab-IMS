"""
IMS Backend - Seed Data Script
Creates a default admin user and initial email templates
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.email_template import EmailTemplate, TemplateTone, TemplateType
from app.utils.security import get_password_hash
from app.config import get_settings

settings = get_settings()

async def seed_data():
    """Seed the database with initial data"""
    async with AsyncSessionLocal() as db:
        # 1. Create Default Admin
        admin_email = "admin@looplab.io"
        result = await db.execute(select(User).where(User.email == admin_email))
        if not result.scalar_one_or_none():
            print(f"Creating default admin: {admin_email}")
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="HR Admin",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
        else:
            print(f"Admin {admin_email} already exists.")

        # 2. Create Default Email Templates
        templates = [
            {
                "name": "Application Received",
                "subject": "We received your application - {company_name}",
                "body": "Hi {applicant_name},\n\nThank you for applying for the {applied_role} position at {company_name}. We have received your CV and will review it shortly.\n\nBest regards,\nHR Team",
                "tone": TemplateTone.FRIENDLY,
                "template_type": TemplateType.APPLICATION_RECEIVED,
                "auto_send_enabled": True
            },
            {
                "name": "Interview Invitation",
                "subject": "Interview Invitation - {company_name} Internship",
                "body": "Hi {applicant_name},\n\nWe were impressed with your application for the {applied_role} role. We would like to invite you for an interview.\n\nPlease let us know your availability.\n\nBest regards,\nHR Team",
                "tone": TemplateTone.FRIENDLY,
                "template_type": TemplateType.INTERVIEW_INVITATION,
                "auto_send_enabled": False
            },
            {
                "name": "Selection Notification",
                "subject": "Welcome to {company_name}! 🎉",
                "body": "Hi {applicant_name},\n\nCongratulations! We are pleased to offer you the {applied_role} internship. We are excited to have you join our team.\n\nNext steps will be sent shortly.\n\nBest regards,\nHR Team",
                "tone": TemplateTone.FRIENDLY,
                "template_type": TemplateType.SELECTED,
                "auto_send_enabled": False
            },
            {
                "name": "Rejection - Generic",
                "subject": "Update on your {company_name} application",
                "body": "Hi {applicant_name},\n\nThank you for your interest in the {applied_role} position. After careful review, we have decided to move forward with other candidates at this time.\n\nWe wish you the best in your career pursuits.\n\nBest regards,\nHR Team",
                "tone": TemplateTone.FORMAL,
                "template_type": TemplateType.REJECTED,
                "auto_send_enabled": False
            }
        ]

        for t_data in templates:
            result = await db.execute(select(EmailTemplate).where(EmailTemplate.name == t_data["name"]))
            if not result.scalar_one_or_none():
                print(f"Creating template: {t_data['name']}")
                template = EmailTemplate(**t_data)
                db.add(template)

        await db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    # Ensure tables exist first
    async def main():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await seed_data()
    
    asyncio.run(main())
