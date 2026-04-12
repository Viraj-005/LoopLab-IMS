"""
Application Service
Core business logic for managing applications
"""
import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from app.models.application import Application, ApplicationStatus, ApplicationSource
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationList
from app.services.duplicate_service import check_duplicates
from app.services.spam_service import check_spam
from app.services.timeline_service import add_timeline_entry
from app.models.timeline import ActionType, PerformerType
from app.services.staff_notification_service import (
    notify_staff_new_application, 
    notify_staff_flag_triggered,
    notify_staff_status_change
)

async def create_application(db: AsyncSession, app_in: ApplicationCreate) -> Application:
    """
    Create a new application with auto-detection for spam and duplicates
    """
    # Create instance and explicitly assign IDs to avoid mapping issues
    app_data = app_in.model_dump()
    application = Application(**app_data)
    
    # Explicit assignment for absolute certainty
    if hasattr(app_in, 'job_id') and app_in.job_id:
        application.job_id = app_in.job_id
    if hasattr(app_in, 'intern_id') and app_in.intern_id:
        application.intern_id = app_in.intern_id
    
    # 1. Check Spam (unless PORTAL source)
    if application.source != ApplicationSource.PORTAL:
        is_spam, spam_reason = await check_spam(db, app_in)
        if is_spam:
            application.spam_flag = True
            application.spam_reason = spam_reason
            await add_timeline_entry(
                db, application.id, ActionType.SPAM_DETECTED, 
                f"Marked as spam: {spam_reason}"
            )
        
        # 2. Check Duplicates (only if not spam and not PORTAL)
        if not is_spam:
            is_duplicate, duplicate_reason = await check_duplicates(db, app_in)
            if is_duplicate:
                application.duplicate_flag = True
                application.duplicate_reason = duplicate_reason
                await add_timeline_entry(
                    db, application.id, ActionType.DUPLICATE_DETECTED, 
                    f"Potential duplicate: {duplicate_reason}"
                )
    else:
        # For Portal applications, we ensure flags are False
        application.spam_flag = False
        application.duplicate_flag = False
            
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    # Staff Notifications
    await notify_staff_new_application(db, application)
    if application.spam_flag:
        await notify_staff_flag_triggered(db, application, "SPAM", application.spam_reason)
    elif application.duplicate_flag:
        await notify_staff_flag_triggered(db, application, "DUPLICATE", application.duplicate_reason)
    
    # Timeline entry for creation
    await add_timeline_entry(
        db, application.id, ActionType.APPLICATION_RECEIVED, 
        f"Application received from {application.email}"
    )
    
    return application


from sqlalchemy.orm import selectinload

async def get_application(db: AsyncSession, application_id: uuid.UUID, load_timeline: bool = False) -> Optional[Application]:
    """Get single application by ID"""
    query = select(Application).where(Application.id == application_id)
    if load_timeline:
        query = query.options(selectinload(Application.timeline))
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_applications(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[ApplicationStatus] = None,
    search: Optional[str] = None,
    source: Optional[ApplicationSource] = None,
    is_duplicate: Optional[bool] = None,
    is_spam: Optional[bool] = None,
    role: Optional[str] = None
) -> Tuple[List[Application], int]:
    """Get list of applications with filtering"""
    query = select(Application)
    
    if status:
        query = query.where(Application.status == status)
    
    if source:
        query = query.where(Application.source == source)
        
    if is_duplicate is not None:
        query = query.where(Application.duplicate_flag == is_duplicate)
        
    if is_spam is not None:
        query = query.where(Application.spam_flag == is_spam)
        
    if role:
        query = query.where(Application.applied_role == role)
        
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Application.applicant_name.ilike(search_term),
                Application.email.ilike(search_term),
                Application.applied_role.ilike(search_term)
            )
        )
        
    # Order by received_at desc
    query = query.order_by(desc(Application.received_at))
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    
    return result.scalars().all(), total


async def get_unique_roles(db: AsyncSession) -> List[str]:
    """Get list of unique applied roles for filtering"""
    query = select(Application.applied_role).distinct().where(Application.applied_role.is_not(None))
    result = await db.execute(query)
    roles = [r for r in result.scalars().all() if r]
    return sorted(roles)


async def update_application(
    db: AsyncSession, 
    application_id: uuid.UUID, 
    app_update: ApplicationUpdate,
    user_email: str
) -> Optional[Application]:
    """Update application fields"""
    application = await get_application(db, application_id)
    if not application:
        return None
        
    update_data = app_update.model_dump(exclude_unset=True)
    
    # Track status changes
    if "status" in update_data and update_data["status"] != application.status:
        old_status = application.status
        new_status = update_data["status"]
        await add_timeline_entry(
            db, application_id, ActionType.STATUS_CHANGED,
            f"Status changed from {old_status} to {new_status}",
            performed_by=user_email,
            performer_type=PerformerType.ADMIN
        )
        # Notify staff about status change
        await notify_staff_status_change(db, application, old_status, new_status, user_email)
        
    # Track manual flag changes
    if "duplicate_flag" in update_data:
        if update_data["duplicate_flag"] is False and application.duplicate_flag:
             await add_timeline_entry(
                db, application_id, ActionType.DUPLICATE_CLEARED,
                "Marked as not a duplicate", performed_by=user_email, performer_type=PerformerType.ADMIN
            )
            
    if "spam_flag" in update_data:
        if update_data["spam_flag"] is False and application.spam_flag:
             await add_timeline_entry(
                db, application_id, ActionType.SPAM_CLEARED,
                "Marked as not spam", performed_by=user_email, performer_type=PerformerType.ADMIN
            )

    # Apply updates
    for key, value in update_data.items():
        setattr(application, key, value)
        
    await db.commit()
    await db.refresh(application)
    return application


async def add_application_note(
    db: AsyncSession,
    application_id: uuid.UUID,
    note: str,
    user_email: str
) -> Optional[Application]:
    """Add a note to an application via timeline"""
    application = await get_application(db, application_id)
    if not application:
        return None
        
    # 1. Update the main application record for quick reference
    # We prepend the new note to show the most recent one at the top of the field
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    new_internal_note = f"[{timestamp}] {note}"
    
    if application.internal_notes:
        application.internal_notes = f"{new_internal_note}\n\n{application.internal_notes}"
    else:
        application.internal_notes = new_internal_note
        
    # 2. Add to timeline for historical tracking
    await add_timeline_entry(
        db, application_id, ActionType.NOTE_ADDED,
        note, performed_by=user_email, performer_type=PerformerType.ADMIN
    )
    await db.commit()
    return application


async def bulk_update_status(
    db: AsyncSession,
    application_ids: List[uuid.UUID],
    status: ApplicationStatus,
    user_email: str
) -> int:
    """Update status for multiple applications"""
    count = 0
    for app_id in application_ids:
        update_data = ApplicationUpdate(status=status)
        app = await update_application(db, app_id, update_data, user_email)
        if app:
            count += 1
    return count
