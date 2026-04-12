"""
Admin Intern Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.intern import Intern
from app.schemas.intern import Intern as InternSchema
from app.services.auth_service import get_current_staff, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin/interns", tags=["Admin Interns"])

@router.get("/", response_model=List[InternSchema])
async def get_all_interns(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Get all registered interns for staff directory"""
    query = select(Intern).order_by(desc(Intern.created_at))
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
