"""
Staff Notification Service
Handles sending alerts to organization staff members
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.application import Application, ApplicationStatus
from app.services.settings_service import get_system_settings
from app.services.email_service import email_service


async def notify_staff_new_application(db: AsyncSession, application: Application):
    """Notify staff about a new application reception"""
    settings = await get_system_settings(db)
    
    if not settings.notify_new_applications:
        return
        
    subject = f"NEW APPLICATION: {application.applicant_name} for {application.applied_role or 'Internship'}"
    body = f"""
    <div style="font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #0f172a;">New Application Received</h2>
        <p>A new candidate has submitted an application for <strong>{settings.org_name}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Name:</strong> {application.applicant_name or 'N/A'}</p>
        <p><strong>Email:</strong> {application.email}</p>
        <p><strong>Applied Role:</strong> {application.applied_role or 'Internship'}</p>
        <p><strong>Source:</strong> {application.source}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><a href="{settings.website}/admin/applications/{application.id}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Application</a></p>
    </div>
    """
    
    await email_service.send_email(settings.contact_email, subject, body)


async def notify_staff_flag_triggered(db: AsyncSession, application: Application, flag_type: str, reason: str):
    """Notify staff when a flag (SPAM or DUPLICATE) is triggered"""
    settings = await get_system_settings(db)
    
    notify = False
    if flag_type == "SPAM" and settings.notify_spam_alerts:
        notify = True
    elif flag_type == "DUPLICATE" and settings.notify_duplicate_detection:
        notify = True
        
    if not notify:
        return
        
    subject = f"ALERT: {flag_type} Detected - {application.applicant_name}"
    body = f"""
    <div style="font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #be123c;">Security Alert: {flag_type} Detected</h2>
        <p>The system has flagged a new application reception as potential <strong>{flag_type}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Candidate:</strong> {application.applicant_name or application.email}</p>
        <p><strong>Detection Reason:</strong> {reason}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><a href="{settings.website}/admin/applications/{application.id}" style="display: inline-block; background: #be123c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Alert</a></p>
    </div>
    """
    
    await email_service.send_email(settings.contact_email, subject, body)


async def notify_staff_status_change(db: AsyncSession, application: Application, old_status: ApplicationStatus, new_status: ApplicationStatus, performed_by: str):
    """Notify staff about a status update"""
    settings = await get_system_settings(db)
    
    if not settings.notify_status_changes:
        return
        
    subject = f"STATUS UPDATE: {application.applicant_name} is now {new_status}"
    body = f"""
    <div style="font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #0f172a;">Application Status Changed</h2>
        <p>An application status has been updated in the IMS.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Candidate:</strong> {application.applicant_name or application.email}</p>
        <p><strong>Status Change:</strong> <span style="color: #64748b; text-decoration: line-through;">{old_status}</span> &rarr; <strong style="color: #0f172a;">{new_status}</strong></p>
        <p><strong>Performed By:</strong> {performed_by}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><a href="{settings.website}/admin/applications/{application.id}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Application</a></p>
    </div>
    """
    
    await email_service.send_email(settings.contact_email, subject, body)
