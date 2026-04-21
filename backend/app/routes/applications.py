"""
Application Routes
CRUD and management endpoints for applications
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.application import ApplicationStatus, ApplicationSource
from app.schemas.application import (
    Application as AppSchema, ApplicationCreate, ApplicationUpdate, 
    ApplicationList, ApplicationDetail, ApplicationNoteCreate, ApplicationEmailSend
)
from app.services.application_service import (
    create_application, get_application, get_applications, 
    update_application, get_unique_roles
)
from app.services.auth_service import get_current_staff
from app.services.email_service import email_service
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from app.models.email_template import TemplateType
from app.models.user import User
from app.utils.file_utils import save_upload_file
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/", response_model=ApplicationList)
async def list_applications(
    page: int = 1,
    size: int = 20,
    status: Optional[ApplicationStatus] = None,
    search: Optional[str] = None,
    source: Optional[ApplicationSource] = None,
    is_duplicate: Optional[bool] = Query(None, alias="is_duplicate"),
    is_spam: Optional[bool] = Query(None, alias="is_spam"),
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
) :
    """List applications with pagination and filters"""
    skip = (page - 1) * size
    items, total = await get_applications(
        db, 
        skip=skip, 
        limit=size, 
        status=status, 
        search=search, 
        source=source, 
        is_duplicate=is_duplicate, 
        is_spam=is_spam,
        role=role
    )
    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/roles", response_model=List[str])
async def list_unique_roles(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get unique roles present in applications for filtering"""
    return await get_unique_roles(db)


@router.get("/{id}", response_model=ApplicationDetail)
async def read_application(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get application details"""
    app = await get_application(db, id, load_timeline=True)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/{id}", response_model=ApplicationDetail)
async def update_application_status(
    id: UUID,
    app_update: ApplicationUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Update application status or flags"""
    app = await update_application(db, id, app_update, user.email)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Refresh with timeline for the response
    app = await get_application(db, id, load_timeline=True)

    # Auto-send emails based on status change
    if app_update.status:
        if app_update.status == ApplicationStatus.SELECTED:
            background_tasks.add_task(email_service.send_template_email, db, app, TemplateType.SELECTED)
        elif app_update.status == ApplicationStatus.REJECTED:
            background_tasks.add_task(email_service.send_template_email, db, app, TemplateType.REJECTED)

    return app


@router.get("/{id}/cv")
async def download_cv(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Download CV file"""
    app = await get_application(db, id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if not app.cv_file_path:
        raise HTTPException(status_code=404, detail="CV not available")
        
    # Check if this is an S3 URL or local path
    if app.cv_file_path.startswith(('http://', 'https://')):
        from app.services.s3_service import s3_service
        from urllib.parse import urlparse
        object_name = urlparse(app.cv_file_path).path.lstrip('/')
        
        if s3_service.enabled and s3_service.s3_client:
            try:
                s3_obj = s3_service.s3_client.get_object(Bucket=s3_service.bucket_name, Key=object_name)
                from fastapi.responses import StreamingResponse
                return StreamingResponse(
                    content=s3_obj['Body'].iter_chunks(), 
                    media_type='application/pdf',
                    headers={"Content-Disposition": f"inline; filename={app.cv_original_filename or object_name}"}
                )
            except Exception as e:
                raise HTTPException(status_code=404, detail="Artifact could not be extracted from AWS S3 vault.")

    return FileResponse(
        app.cv_file_path, 
        media_type='application/pdf',
        content_disposition_type='inline'
    )


@router.get("/{id}/cover-letter")
async def download_cover_letter(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Download Cover Letter file"""
    app = await get_application(db, id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if not app.cover_letter_path:
        raise HTTPException(status_code=404, detail="Cover letter not available")
        
    # Check if this is an S3 URL or local path
    if app.cover_letter_path.startswith(('http://', 'https://')):
        from app.services.s3_service import s3_service
        from urllib.parse import urlparse
        object_name = urlparse(app.cover_letter_path).path.lstrip('/')
        
        if s3_service.enabled and s3_service.s3_client:
            try:
                s3_obj = s3_service.s3_client.get_object(Bucket=s3_service.bucket_name, Key=object_name)
                from fastapi.responses import StreamingResponse
                return StreamingResponse(
                    content=s3_obj['Body'].iter_chunks(), 
                    media_type='application/pdf',
                    headers={"Content-Disposition": f"inline; filename={app.cover_letter_original_filename or object_name}"}
                )
            except Exception as e:
                raise HTTPException(status_code=404, detail="Artifact could not be extracted from AWS S3 vault.")

    return FileResponse(
        app.cover_letter_path, 
        media_type='application/pdf',
        content_disposition_type='inline'
    )


@router.post("/", response_model=AppSchema)
async def create_new_application(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    applicant_name: Optional[str] = Form(None),
    applied_role: Optional[str] = Form(None),
    cv: UploadFile = File(...),
    cover_letter: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Manually create application (e.g. from admin panel)"""
    file_path, file_hash = await save_upload_file(cv)
    
    cl_path = None
    cl_filename = None
    if cover_letter:
        cl_path, _ = await save_upload_file(cover_letter)
        cl_filename = cover_letter.filename
        
    app_in = ApplicationCreate(
        email=email,
        applicant_name=applicant_name,
        applied_role=applied_role,
        cv_file_path=file_path,
        cv_hash=file_hash,
        cv_original_filename=cv.filename,
        cover_letter_path=cl_path,
        cover_letter_original_filename=cl_filename
    )
    
    app = await create_application(db, app_in)
    
    # Auto-reply for receipt
    background_tasks.add_task(email_service.send_template_email, db, app, TemplateType.APPLICATION_RECEIVED)
    
    return app


@router.post("/{id}/send-email")
async def send_email_to_applicant(
    id: UUID,
    email_data: ApplicationEmailSend,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Send manual email to applicant"""
    app = await get_application(db, id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.source == ApplicationSource.PORTAL and app.intern_id:
        # 1. Create Internal Notification
        new_notif = Notification(
            intern_id=app.intern_id,
            application_id=app.id,
            subject=email_data.subject,
            body=email_data.body
        )
        db.add(new_notif)
        
        # 2. Send Email Alert (Not the full message, just an alert)
        alert_subject = "New Signal Received on Your Dashboard"
        alert_body = f"""
        Hello,
        
        You have received a new evaluation signal from HR regarding your application for {app.applied_role}.
        
        Subject: {email_data.subject}
        
        Please log in to your LOOPLAB Intern Portal to view the full details and respond if necessary.
        
        Best regards,
        HR Team
        """
        await email_service.send_email(app.email, alert_subject, alert_body)
        success = True
        log_msg = f"Sent portal signal and email alert: {email_data.subject}"
    else:
        # EMAIL source - send full email directly
        success = await email_service.send_email(app.email, email_data.subject, email_data.body)
        log_msg = f"Sent manual email: {email_data.subject}"

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send official signal")
        
    # Log to timeline
    from app.services.timeline_service import add_timeline_entry
    from app.models.timeline import ActionType, PerformerType
    
    await add_timeline_entry(
        db, app.id, ActionType.EMAIL_SENT, 
        log_msg, 
        performed_by=user.email, 
        performer_type=PerformerType.ADMIN
    )
    await db.commit()
    
    return {"message": "Email sent successfully"}


@router.post("/bulk/status")
async def bulk_update_applications_status(
    ids: List[UUID],
    status: ApplicationStatus,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Bulk update application status"""
    from app.services.application_service import bulk_update_status
    count = await bulk_update_status(db, ids, status, user.email)
    return {"message": f"Updated {count} applications", "count": count}


@router.post("/{id}/notes")
async def add_note_to_application(
    id: UUID,
    note_in: ApplicationNoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Add an internal note to application timeline"""
    from app.services.application_service import add_application_note
    app = await add_application_note(db, id, note_in.note, user.email)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Note added"}
