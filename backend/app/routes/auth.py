"""
Auth Routes (Staff)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.database import get_db
from app.services.auth_service import (
    authenticate_staff, 
    get_current_staff, 
    update_refresh_token
)
from app.schemas.user import Token, User, UserLogin
from app.utils.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["Staff Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """Staff login endpoint (HR and COFOUNDER)"""
    login_data = UserLogin(email=form_data.username, password=form_data.password)
    user = await authenticate_staff(db, login_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=user.id, user_type="staff")
    refresh_token = create_refresh_token(subject=user.id)
    
    # Store refresh token hash in DB
    await update_refresh_token(db, user, refresh_token)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "user": user
    }


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_staff)]
):
    """Get current authenticated staff member"""
    return current_user


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_staff)],
    db: AsyncSession = Depends(get_db)
):
    """Staff logout endpoint — invalidates refresh token"""
    current_user.refresh_token_hash = None
    await db.commit()
    return {"message": "Successfully logged out"}
