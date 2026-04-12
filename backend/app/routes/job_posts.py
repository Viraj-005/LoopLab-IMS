import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.database import get_db
from app.models.job_post import JobPost, JobStatus, JobCategory
from app.models.application import Application
from app.models.user import User
from app.schemas.job_post import JobPostCreate, JobPostUpdate, JobPost as JobPostSchema, JobPostList
from app.services.auth_service import get_current_staff, get_any_active_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/job-posts", tags=["Job Posts"])

# ... (previous routes) ...

@router.post("/{job_id}/media", response_model=JobPostSchema)
async def upload_job_media(
    job_id: UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Upload feature media (image/video) for a job post"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    file = files[0] # Currently JobPost only supports one feature media URL
    
    query = select(JobPost).where(JobPost.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")
    
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Create unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"job_{job_id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.upload_dir, filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()
        
    # Update job post with media URL
    job.media_url = f"/uploads/{filename}"
    await db.commit()
    await db.refresh(job)
    
    return job


@router.post("/", response_model=JobPostSchema)
async def create_job_post(
    job_in: JobPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Create a new job post (HR/Admin only)"""
    new_job = JobPost(**job_in.model_dump())
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job


@router.get("/", response_model=JobPostList)
async def list_job_posts(
    status: Optional[JobStatus] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    auth_data: dict = Depends(get_any_active_user)
):
    """List job posts with real application counts"""
    is_intern = auth_data["type"] == "intern"
    
    # If intern, they can only see Live jobs
    if is_intern:
        status = JobStatus.LIVE
    # Use a subquery to count applications per job
    app_count_sub = (
        select(
            Application.job_id,
            func.count(Application.id).label("count")
        )
        .group_by(Application.job_id)
        .subquery()
    )

    query = (
        select(
            JobPost,
            func.coalesce(app_count_sub.c.count, 0).label("application_count")
        )
        .outerjoin(app_count_sub, JobPost.id == app_count_sub.c.job_id)
    )

    if status:
        query = query.where(JobPost.status == status)
    if category:
        query = query.where(JobPost.category == category)
    
    query = query.order_by(JobPost.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    # If intern, check which jobs they've applied to
    applied_ids = set()
    if is_intern:
        intern_obj = auth_data["obj"]
        app_query = select(Application.job_id).where(Application.intern_id == intern_obj.id)
        app_res = await db.execute(app_query)
        applied_ids = set(app_res.scalars().all())
    
    # Process rows to attach application_count and applied flag to job objects
    items = []
    for job, count in rows:
        job.application_count = count
        job.applied = job.id in applied_ids
        items.append(job)
    
    # Total count for pagination
    count_query = select(func.count()).select_from(JobPost)
    if status:
        count_query = count_query.where(JobPost.status == status)
    if category:
        count_query = count_query.where(JobPost.category == category)
    
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return {"items": items, "total": total}


@router.get("/{job_id}", response_model=JobPostSchema)
async def get_job_post(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    auth_data: dict = Depends(get_any_active_user)
):
    """Get details of a specific job post"""
    is_intern = auth_data["type"] == "intern"
    
    query = select(JobPost).where(JobPost.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")
        
    # Interns can only see Live jobs
    if is_intern and job.status != JobStatus.LIVE:
        raise HTTPException(status_code=403, detail="Forbidden: Draft or Closed job")
        
    # Check if applied
    if is_intern:
        intern_obj = auth_data["obj"]
        app_query = select(Application.id).where(
            Application.job_id == job_id, 
            Application.intern_id == intern_obj.id
        )
        app_res = await db.execute(app_query)
        job.applied = app_res.scalar_one_or_none() is not None
    
    return job


@router.patch("/{job_id}", response_model=JobPostSchema)
async def update_job_post(
    job_id: UUID,
    job_update: JobPostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Update a job post"""
    query = select(JobPost).where(JobPost.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")
    
    update_data = job_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    
    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{job_id}")
async def delete_job_post(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Delete a job post"""
    query = select(JobPost).where(JobPost.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")
    
    await db.delete(job)
    await db.commit()
    return {"message": "Job post deleted successfully"}
