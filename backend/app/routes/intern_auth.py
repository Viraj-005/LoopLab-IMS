"""
Intern Auth Routes
Handles Google OAuth callback and token issuance for applicants
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.intern import InternToken, Intern
from app.services.oauth_service import exchange_google_code, get_or_create_intern_from_google
from app.services.auth_service import update_refresh_token, get_current_intern
from app.utils.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth/intern", tags=["Intern Authentication"])


@router.get("/google/callback", response_model=InternToken)
async def google_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Callback for Google OAuth flow (Applicants ONLY)"""
    # 1. Exchange code for user info
    google_user = await exchange_google_code(code)
    
    # 2. Get/Create Intern identity
    intern = await get_or_create_intern_from_google(db, google_user)
    
    if not intern.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Intern account is deactivated"
        )
    
    # 3. Issue tokens with intern claim
    access_token = create_access_token(subject=intern.id, user_type="intern")
    refresh_token = create_refresh_token(subject=intern.id)
    
    # 4. Store refresh token hash
    await update_refresh_token(db, intern, refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "intern": intern
    }


@router.get("/me", response_model=Intern)
async def get_my_profile(
    current_intern: Intern = Depends(get_current_intern)
):
    """Get current authenticated intern profile"""
    return current_intern


@router.post("/logout")
async def logout(
    current_intern: Intern = Depends(get_current_intern),
    db: AsyncSession = Depends(get_db)
):
    """Intern logout endpoint"""
    current_intern.refresh_token_hash = None
    await db.commit()
    return {"message": "Successfully logged out from intern portal"}
