"""
Dashboard Routes
Statistics for the admin dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta

from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.timeline import ApplicationTimeline
from app.services.auth_service import get_current_staff
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get application statistics"""
    
    # Helper to count
    async def count_by_filter(filter_expr):
        query = select(func.count()).select_from(Application).where(filter_expr)
        result = await db.execute(query)
        return result.scalar() or 0

    total_apps = await count_by_filter(True)  # True is always true, count all
    pending = await count_by_filter(Application.status == ApplicationStatus.PENDING)
    selected = await count_by_filter(Application.status == ApplicationStatus.SELECTED)
    rejected = await count_by_filter(Application.status == ApplicationStatus.REJECTED)
    duplicates = await count_by_filter(Application.duplicate_flag == True)
    spam = await count_by_filter(Application.spam_flag == True)
    
    return {
        "total_applications": total_apps,
        "pending_review": pending,
        "selected": selected,
        "rejected": rejected,
        "possible_duplicates": duplicates,
        "suspected_spam": spam
    }


@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get recent timeline activity"""
    query = select(ApplicationTimeline).order_by(desc(ApplicationTimeline.created_at)).limit(limit)
    result = await db.execute(query)
    # Ideally should join with Application to get applicant name, but can be done in frontend or simplified schema
    return result.scalars().all()


@router.get("/chart")
async def get_chart_data(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get applications over time for chart"""
    # Simple grouping by date
    # In production, use database date_trunc
    start_date = datetime.utcnow() - timedelta(days=days)
    query = select(Application.received_at).where(Application.received_at >= start_date)
    result = await db.execute(query)
    dates = result.scalars().all()
    
    # Process in python for simplicity in Phase 1
    # Returns count per day
    from collections import Counter
    counts = Counter(d.date().isoformat() for d in dates)
    
    sorted_data = [{"date": k, "count": v} for k, v in sorted(counts.items())]
    return sorted_data
