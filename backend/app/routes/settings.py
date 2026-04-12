"""
System Settings Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database import get_db
from app.models.user import UserRole
from app.schemas.settings import SystemSettings as SystemSettingsSchema, SystemSettingsUpdate
from app.schemas.user import User as UserSchema
from app.services.auth_service import get_current_staff, require_role
from app.services.settings_service import get_system_settings, update_system_settings

router = APIRouter(prefix="/settings", tags=["System Settings"])

# Staff members can view settings
# Admin/Cofounder can edit settings

@router.get("/", response_model=SystemSettingsSchema)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[UserSchema, Depends(get_current_staff)] = None
):
    """Retrieve global system settings"""
    return await get_system_settings(db)


@router.put("/", response_model=SystemSettingsSchema)
async def update_settings(
    settings_in: SystemSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Annotated[UserSchema, Depends(require_role([UserRole.ADMIN, UserRole.COFOUNDER]))] = None
):
    """Update global system settings (Admin/Cofounder only)"""
    return await update_system_settings(db, settings_in)
