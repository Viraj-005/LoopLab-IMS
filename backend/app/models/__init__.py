"""IMS Models Package"""
from app.models.user import User, UserRole
from app.models.intern import Intern, OAuthProvider
from app.models.application import Application, ApplicationStatus
from app.models.timeline import ApplicationTimeline
from app.models.email_template import EmailTemplate
from app.models.job_post import JobPost
from app.models.notification import Notification
from app.models.settings import SystemSettings

__all__ = [
    "User", 
    "UserRole",
    "Intern", 
    "OAuthProvider",
    "Application", 
    "ApplicationStatus",
    "ApplicationTimeline", 
    "EmailTemplate", 
    "JobPost",
    "Notification",
    "SystemSettings"
]
