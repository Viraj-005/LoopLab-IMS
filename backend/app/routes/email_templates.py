"""
Email Template Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.email_template import EmailTemplate
from app.schemas.email_template import EmailTemplate as TemplateSchema, EmailTemplateCreate, EmailTemplateUpdate
from app.services.auth_service import get_current_staff
from app.models.user import User

router = APIRouter(prefix="/email-templates", tags=["Email Templates"])


@router.get("/", response_model=List[TemplateSchema])
async def get_templates(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """List all email templates"""
    result = await db.execute(select(EmailTemplate))
    return result.scalars().all()


@router.post("/", response_model=TemplateSchema)
async def create_template(
    template_in: EmailTemplateCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Create a new template"""
    template = EmailTemplate(**template_in.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.put("/{id}", response_model=TemplateSchema)
async def update_template(
    id: UUID,
    template_in: EmailTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Update a template"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    update_data = template_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
        
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{id}")
async def delete_template(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_staff)
):
    """Delete a template"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    await db.delete(template)
    await db.commit()
    return {"message": "Template deleted"}
