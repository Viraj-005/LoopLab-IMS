"""
Webhook Routes
Handling inbound emails from Mailgun
"""
from fastapi import APIRouter, Request, BackgroundTasks, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import aiofiles
import os
from datetime import datetime

from app.database import get_db
from app.services.application_service import create_application
from app.models.application import ApplicationSource
from app.schemas.application import ApplicationCreate
from app.services.email_service import email_service
from app.models.email_template import TemplateType
from app.config import get_settings
from app.utils.file_utils import save_upload_file

settings = get_settings()
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


async def process_inbound_email(
    sender: str,
    subject: str,
    body_plain: str,
    # Mailgun sends attachments as file fields with numeric keys usually, we need request to parse
    attachments: list, 
    db: AsyncSession
):
    """Logic to process parsed email"""
    # Simple extraction of email address from "Name <email@domain.com>"
    import re
    email_match = re.search(r'<(.+?)>', sender)
    email_address = email_match.group(1) if email_match else sender
    name_match = re.match(r'(.+?) <', sender)
    name = name_match.group(1).strip() if name_match else None
    
    # Save first attachment as CV
    cv_path = None
    cv_hash = None
    original_filename = None
    
    if attachments:
        # Assuming the first attachment is the CV for now
        attachment = attachments[0]
        cv_path, cv_hash = await save_upload_file(attachment)
        original_filename = attachment.filename
    
    app_in = ApplicationCreate(
        email=email_address,
        applicant_name=name,
        applied_role="General Application",  # We might try to extract this from subject
        email_subject=subject,
        email_body=body_plain,
        cv_file_path=cv_path,
        cv_hash=cv_hash,
        cv_original_filename=original_filename,
        source=ApplicationSource.EMAIL,
        received_at=datetime.utcnow()
    )
    
    app = await create_application(db, app_in)
    
    # Send auto-reply
    await email_service.send_template_email(db, app, TemplateType.APPLICATION_RECEIVED)


@router.post("/mailgun")
async def mailgun_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle inbound email from Mailgun.
    Mailgun sends multipart/form-data.
    """
    # Verify signature - skipped for Phase 1 simplicity, but CRITICAL for production
    
    form = await request.form()
    
    sender = form.get("from")
    subject = form.get("subject")
    body_plain = form.get("body-plain")
    
    attachments = []
    # Mailgun sends attachments as 'attachment-1', 'attachment-2', etc.
    # Or just 'attachment' if single? Documentation says usage of attachment-x
    # We'll just grab all UploadFile objects from form
    
    for key, value in form.items():
        if isinstance(value, type(None)): continue
        # in starlette/fastapi form parsing, file uploads are UploadFile objects
        if hasattr(value, "filename") and value.filename:
             attachments.append(value)
             
    if not sender or not subject:
         # Log error but return 200 to Mailgun so it doesn't retry infinitely
         return {"status": "ignored", "reason": "missing_fields"}

    # Process in background to respond quickly to webhook
    # Note: We need a new session for background task usually, but here we pass the task runner
    # We should actually refactor to specific task function that creates its own session
    # For now, we will await it here or use a proper background task wrapper that handles sessions.
    # Since `db` session might close after request, strictly speaking we should not pass `db` to background task.
    # We will await it synchronously for simplicity in this phase or assume session stays open (it won't).
    
    # FIX: Run logic inline for now to ensure DB write succeeds
    await process_inbound_email(sender, subject, body_plain, attachments, db)

    return {"status": "received"}
