from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.notification import Notification
from app.models.intern import Intern
from app.schemas.notification import Notification as NotificationSchema
from app.services.auth_service import get_current_intern

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationSchema])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_intern: Intern = Depends(get_current_intern)
):
    """Get all notifications for the current intern"""
    result = await db.execute(
        select(Notification)
        .where(Notification.intern_id == current_intern.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_intern: Intern = Depends(get_current_intern)
):
    """Mark a notification as read"""
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.intern_id == current_intern.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "Protocol acknowledged."}
