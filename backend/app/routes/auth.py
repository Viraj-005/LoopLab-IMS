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
from app.schemas.user import (
    Token, User, UserLogin, PasswordChange,
    ForgotPasswordRequest, ResetPassword, TwoFASetup, TwoFAVerify
)
from app.utils.security import (
    create_access_token, create_refresh_token, 
    verify_password, get_password_hash, create_temp_token,
    decode_token
)
from app.services.security_service import (
    generate_totp_secret, get_totp_uri, generate_qr_code_base64,
    verify_totp_code, generate_reset_token, get_user_by_reset_token
)
from app.services.email_service import email_service
from app.models.email_template import TemplateType
from datetime import datetime

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
        
    if user.is_2fa_enabled:
        temp_token = create_temp_token(subject=user.id)
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "user": user # Pass user so frontend knows name/avatar if needed
        }

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


@router.post("/2fa/verify-login", response_model=Token)
async def verify_login_2fa(
    verify_data: TwoFAVerify,
    db: AsyncSession = Depends(get_db)
):
    """Verify 2FA code to complete login"""
    payload = decode_token(verify_data.temp_token)
    if not payload or payload.get("type") != "2fa_challenge":
         raise HTTPException(status_code=401, detail="Invalid or expired challenge token")
    
    user_id = payload.get("sub")
    from app.services.auth_service import get_staff_by_id
    user = await get_staff_by_id(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    if not verify_totp_code(user.totp_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    access_token = create_access_token(subject=user.id, user_type="staff")
    refresh_token = create_refresh_token(subject=user.id)
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


@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_staff)],
    db: AsyncSession = Depends(get_db)
):
    """Change the current user's password"""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.password_changed_at = datetime.utcnow()
    
    await db.commit()
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    from app.services.auth_service import get_staff_by_email
    user = await get_staff_by_email(db, request.email)
    
    if user:
        token, expires = generate_reset_token()
        user.reset_token = token
        user.reset_token_expires = expires
        await db.commit()
        
        # In a real app, send email here
        # We'll use the basic send_email method
        await email_service.send_email(
            user.email,
            "Password Reset Protocol",
            f"Your security reset code is: <b>{token}</b>. Valid for 15 minutes."
        )
        
    # Always return success to avoid email enumeration
    return {"message": "If this email is registered, a reset code has been dispatched."}


@router.post("/reset-password")
async def reset_password(
    data: ResetPassword,
    db: AsyncSession = Depends(get_db)
):
    """Complete password reset with token and optional 2FA"""
    user = await get_user_by_reset_token(db, data.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    # If 2FA is enabled, require code for password reset too (maximum security as requested)
    if user.is_2fa_enabled:
        if not data.two_fa_code:
            raise HTTPException(status_code=403, detail="2FA_REQUIRED")
        if not verify_totp_code(user.totp_secret, data.two_fa_code):
            raise HTTPException(status_code=400, detail="Invalid 2FA security code")
            
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.password_changed_at = datetime.utcnow()
    
    await db.commit()
    return {"message": "Security credentials updated successfully."}


@router.get("/2fa/setup", response_model=TwoFASetup)
async def setup_2fa(
    current_user: Annotated[User, Depends(get_current_staff)],
    db: AsyncSession = Depends(get_db)
):
    """Initialize 2FA setup by generating a secret and QR code"""
    secret = generate_totp_secret()
    # Temporarily store secret in user object but don't enable yet
    current_user.totp_secret = secret
    await db.commit()
    
    uri = get_totp_uri(current_user.email, secret)
    qr_code = generate_qr_code_base64(uri)
    
    return {"secret": secret, "qr_code_url": f"data:image/png;base64,{qr_code}"}


@router.post("/2fa/enable")
async def enable_2fa(
    verify_data: TwoFAVerify,
    current_user: Annotated[User, Depends(get_current_staff)],
    db: AsyncSession = Depends(get_db)
):
    """Confirm and enable 2FA for the account"""
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initialized")
        
    if verify_totp_code(current_user.totp_secret, verify_data.code):
        current_user.is_2fa_enabled = True
        await db.commit()
        return {"message": "Two-Factor Authentication activated."}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")


@router.post("/2fa/disable")
async def disable_2fa(
    verify_data: TwoFAVerify,
    current_user: Annotated[User, Depends(get_current_staff)],
    db: AsyncSession = Depends(get_db)
):
    """Disable 2FA for the account"""
    if not verify_totp_code(current_user.totp_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    await db.commit()
    return {"message": "Two-Factor Authentication deactivated."}
