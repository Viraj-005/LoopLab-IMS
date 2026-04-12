"""
Spam Detection Service
Logic to identify spam applications
"""
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.application import Application
from app.schemas.application import ApplicationCreate
from app.services.settings_service import get_system_settings

async def check_spam(db: AsyncSession, app_data: ApplicationCreate) -> tuple[bool, str]:
    """
    Check if application is spam.
    Returns: (is_spam, reason)
    """
    reasons = []
    is_spam = False
    
    # Check if spam detection is enabled
    settings = await get_system_settings(db)
    if not settings.enable_spam_detection:
        return False, ""
    
    # 1. Missing CV
    if not app_data.cv_file_path:
        # Assuming email applications MUST have attachments
        # For API submissions this might differ, but let's be strict for now as per requirements
        is_spam = True
        reasons.append("No CV attached to application")

    # 2. Rapid repeated submissions (Flood detection)
    # Check if we received > 3 applications from same email in last 1 hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    query_flood = select(func.count()).select_from(Application).where(
        and_(
            Application.email == app_data.email,
            Application.received_at >= one_hour_ago
        )
    )
    result_flood = await db.execute(query_flood)
    count = result_flood.scalar() or 0
    
    if count >= 3:
        is_spam = True
        reasons.append(f"Rapid submission detected: {count} applications in last hour")
        
    return is_spam, "; ".join(reasons)

def is_random_content(text: str) -> bool:
    """Basic heuristic for random content - placeholder"""
    # In a real system this would use NLP or char distribution analysis
    if len(text) < 10:
        return True
    return False
