"""
Admin Intern Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.intern import Intern
from app.schemas.intern import Intern as InternSchema, InternRegistryDetail
from app.services.auth_service import get_current_staff, require_role
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.services.email_service import email_service
from app.schemas.application import ApplicationEmailSend

router = APIRouter(prefix="/admin/interns", tags=["Admin Interns"])

@router.get("/", response_model=List[InternRegistryDetail])
async def get_all_interns(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get all registered interns for staff directory"""
    query = select(Intern).options(selectinload(Intern.applications)).order_by(desc(Intern.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{intern_id}/deactivate")
async def toggle_intern_status(
    intern_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role([UserRole.ADMIN, UserRole.COFOUNDER]))
):
    """Toggle intern active status (Admin/Cofounder only)"""
    query = select(Intern).where(Intern.id == intern_id)
    result = await db.execute(query)
    intern = result.scalar_one_or_none()
    
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
        
    intern.is_active = not intern.is_active
    await db.commit()
    
    status_str = "activated" if intern.is_active else "deactivated"
    return {"message": f"Intern account successfully {status_str}"}


@router.post("/{intern_id}/signal")
async def send_signal_to_intern(
    intern_id: UUID,
    signal_data: ApplicationEmailSend,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Send a manual signal (notification + email alert) to an intern from the registry"""
    query = select(Intern).where(Intern.id == intern_id)
    result = await db.execute(query)
    intern = result.scalar_one_or_none()
    
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
        
    # 1. Create Internal Notification (No application_id)
    new_notif = Notification(
        intern_id=intern.id,
        subject=signal_data.subject,
        body=signal_data.body
    )
    db.add(new_notif)
    
    # 2. Send Email Alert
    alert_subject = signal_data.subject
    alert_body = f"""
    Hello {intern.first_name},
    
    You have received a new evaluation signal from HR regarding your profile status.
    
    Subject: {signal_data.subject}
    
    Message:
    {signal_data.body}
    
    Please log in to your LOOPLAB Intern Portal to view details and respond.
    
    Best regards,
    HR Team
    """
    
    await email_service.send_email(intern.email, alert_subject, alert_body)
    await db.commit()
    
    return {"message": "Signal transmitted successfully"}
