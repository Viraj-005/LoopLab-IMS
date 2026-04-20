import os
import shutil
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.intern import Intern
from app.models.job_post import JobPost
from app.models.application import Application, ApplicationStatus, ApplicationSource
from app.schemas.intern import Intern as InternSchema, InternProfileUpdate
from app.schemas.application import Application as ApplicationSchema, ApplicationCreate, InternApplicationDetail
from app.services.auth_service import get_current_intern
from app.services.application_service import create_application
from app.services.s3_service import s3_service
from app.utils.file_utils import save_upload_file
from app.config import get_settings
from app.services.email_service import email_service
from app.models.email_template import TemplateType

router = APIRouter(prefix="/intern", tags=["Intern Portal"])
settings = get_settings()


@router.get("/profile", response_model=InternSchema)
async def get_my_profile(
    current_intern: Intern = Depends(get_current_intern)
):
    """Get current intern's detailed profile"""
    return current_intern


@router.put("/profile", response_model=InternSchema)
async def update_profile(
    profile_data: InternProfileUpdate,
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Update intern profile fields"""
    # Check if this update completes the profile
    # For simplicity, we consider profile complete if phone and university are provided
    update_dict = profile_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(current_intern, key, value)
    
    if current_intern.phone and current_intern.education_history:
        current_intern.profile_complete = True
        
    await db.commit()
    await db.refresh(current_intern)
    return current_intern


@router.get("/applications", response_model=List[ApplicationSchema])
async def get_my_applications(
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """List applications submitted by the current intern"""
    result = await db.execute(
        select(Application)
        .where(Application.intern_id == current_intern.id)
        .order_by(Application.received_at.desc())
    )
    return result.scalars().all()


@router.get("/applications/{app_id}", response_model=InternApplicationDetail)
async def get_application_detail(
    app_id: uuid.UUID,
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed view of a specific application for the intern"""
    result = await db.execute(
        select(Application)
        .where(
            Application.id == app_id,
            Application.intern_id == current_intern.id
        )
        .options(
            selectinload(Application.job_post),
            selectinload(Application.timeline)
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found in your stream.")
    return app


@router.get("/applications/{app_id}/cv")
async def download_my_cv(
    app_id: uuid.UUID,
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Stream submitted CV artifact for the specified application"""
    result = await db.execute(
        select(Application).where(
            Application.id == app_id,
            Application.intern_id == current_intern.id
        )
    )
    app = result.scalar_one_or_none()
    if not app or not app.cv_file_path:
        raise HTTPException(status_code=404, detail="CV artifact not found.")
    
    # Check if this is an S3 URL or a local path
    if app.cv_file_path.startswith('http'):
        # Extract object name from URL
        # URL format: https://bucket.s3.region.amazonaws.com/object_name
        object_name = app.cv_file_path.split('/')[-1]
        presigned_url = s3_service.get_presigned_url(object_name)
        if presigned_url:
            from fastapi.responses import RedirectResponse
            return RedirectResponse(presigned_url)
    
    return FileResponse(
        app.cv_file_path,
        media_type='application/pdf',
        content_disposition_type='inline'
    )


@router.get("/applications/{app_id}/cover-letter")
async def download_my_cover_letter(
    app_id: uuid.UUID,
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Stream submitted Cover Letter artifact for the specified application"""
    result = await db.execute(
        select(Application).where(
            Application.id == app_id,
            Application.intern_id == current_intern.id
        )
    )
    app = result.scalar_one_or_none()
    if not app or not app.cover_letter_path:
        raise HTTPException(status_code=404, detail="Cover letter artifact not found.")
    
    # Check if this is an S3 URL or a local path
    if app.cover_letter_path.startswith('http'):
        object_name = app.cover_letter_path.split('/')[-1]
        presigned_url = s3_service.get_presigned_url(object_name)
        if presigned_url:
            from fastapi.responses import RedirectResponse
            return RedirectResponse(presigned_url)

    return FileResponse(
        app.cover_letter_path,
        media_type='application/pdf',
        content_disposition_type='inline'
    )


@router.post("/apply/{job_id}", response_model=ApplicationSchema)
async def apply_for_job(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    resume: UploadFile = File(...),
    cover_letter: Optional[UploadFile] = File(None),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Submit a new job application via the intern portal"""
    # 1. Check if job exists and is live
    job_res = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = job_res.scalar_one_or_none()
    if not job or job.status != "Live":
        raise HTTPException(status_code=404, detail="Job posting not found or not active")

    # 2. Check if already applied
    existing_res = await db.execute(
        select(Application).where(
            Application.intern_id == current_intern.id,
            Application.job_id == job_id
        )
    )
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already applied for this position")

    # 3. Handle file uploads using utility (S3 or Local)
    # Reusing current_intern.id for filename to keep it consistent
    resume_ext = os.path.splitext(resume.filename)[1]
    resume_filename = f"resume_{current_intern.id}{resume_ext}"
    
    # Save resume (Private)
    resume_path, _ = await save_upload_file(resume, custom_filename=resume_filename, is_private=True)

    # Save cover letter if provided (Private)
    cl_path = None
    cl_original_name = None
    if cover_letter:
        cl_ext = os.path.splitext(cover_letter.filename)[1]
        cl_filename = f"cover_letter_{current_intern.id}{cl_ext}"
        cl_original_name = cover_letter.filename
        cl_path, _ = await save_upload_file(cover_letter, custom_filename=cl_filename, is_private=True)

    # 4. Create application via service
    app_in = ApplicationCreate(
        intern_id=current_intern.id,
        job_id=job_id,
        applicant_name=full_name,
        email=email,
        phone=phone,
        applied_role=job.title,
        cv_file_path=resume_path,
        cv_original_filename=resume.filename,
        cover_letter_path=cl_path,
        cover_letter_original_filename=cl_original_name,
        source=ApplicationSource.PORTAL,
        received_at=datetime.utcnow()
    )
    
    application = await create_application(db, app_in)
    
    # 5. Optionally update intern profile if it was empty
    if not current_intern.phone:
        current_intern.phone = phone
        await db.commit()

    # 6. Auto-reply for receipt
    background_tasks.add_task(email_service.send_template_email, db, application, TemplateType.APPLICATION_RECEIVED)

    return application
