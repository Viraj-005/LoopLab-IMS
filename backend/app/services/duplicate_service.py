"""
Duplicate Detection Service
Logic to identify potential duplicate applications
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.application import Application
from app.schemas.application import ApplicationCreate

async def check_duplicates(db: AsyncSession, app_data: ApplicationCreate) -> tuple[bool, str]:
    """
    Check if application is a duplicate.
    Returns: (is_duplicate, reason)
    """
    reason_parts = []
    is_duplicate = False
    
    # 1. Check Email
    query_email = select(Application).where(Application.email == app_data.email)
    result_email = await db.execute(query_email)
    existing_email = result_email.scalars().first()
    
    if existing_email:
        is_duplicate = True
        reason_parts.append(f"Same email address submitted application on {existing_email.created_at.date()}")

    # 2. Check CV Hash (if provided)
    if app_data.cv_hash:
        query_hash = select(Application).where(Application.cv_hash == app_data.cv_hash)
        result_hash = await db.execute(query_hash)
        existing_hash = result_hash.scalars().first()
        
        if existing_hash:
            is_duplicate = True
            reason_parts.append(f"Identical CV content detected (matched with application from {existing_hash.created_at.date()})")

    # 3. Check Name + Phone
    if app_data.applicant_name and app_data.phone:
        query_details = select(Application).where(
            and_(
                Application.applicant_name == app_data.applicant_name,
                Application.phone == app_data.phone
            )
        )
        result_details = await db.execute(query_details)
        existing_details = result_details.scalars().first()
        
        if existing_details:
            is_duplicate = True
            reason_parts.append("Matching name and phone number detected")
            
    return is_duplicate, "; ".join(reason_parts)
