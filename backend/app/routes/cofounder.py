"""
Co-founder (Admin) Routes
Handles staff management and high-level platform configuration
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.services.auth_service import require_role, create_staff_user
from app.utils.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Co-founder Admin"])

# Protected: Only COFOUNDERs or ADMINs can access any route here
admin_dependency = Depends(require_role([UserRole.COFOUNDER, UserRole.ADMIN]))


@router.get("/users", response_model=List[UserSchema], dependencies=[admin_dependency])
async def list_staff_members(
    db: AsyncSession = Depends(get_db)
):
    """List all staff users (HR and Co-founders)"""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/users", response_model=UserSchema, dependencies=[admin_dependency])
async def add_staff_member(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new staff user"""
    return await create_staff_user(db, user_in)


@router.put("/users/{user_id}", response_model=UserSchema, dependencies=[admin_dependency])
async def update_staff_member(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update staff user details or status"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        user.hashed_password = get_password_hash(update_data.pop("password"))
        user.password_changed_at = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(user, key, value)
        
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", dependencies=[admin_dependency])
async def deactivate_staff_member(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a staff member (don't delete, just disable)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")
        
    user.is_active = False
    await db.commit()
    return {"message": "Staff member deactivated"}
