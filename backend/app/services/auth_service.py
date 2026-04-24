"""
Auth Service
Handles user authentication and logic for both Staff and Interns
"""
import uuid
from typing import Optional, Union, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.database import get_db
from app.models.user import User, UserRole
from app.models.intern import Intern
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token, 
    hash_token,
    decode_token
)
from app.config import get_settings

settings = get_settings()
# OAuth2 scheme for Swagger UI and general auth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_staff_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Fetch staff user by email"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_staff_by_id(db: AsyncSession, user_id: Union[str, uuid.UUID]) -> Optional[User]:
    """Fetch staff user by ID"""
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_staff(db: AsyncSession, login_data: UserLogin) -> Optional[User]:
    """Authenticate staff user with email and password with lockout logic"""
    user = await get_staff_by_email(db, login_data.email)
    
    if not user:
        return None
        
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked. Please try again after {user.locked_until.strftime('%H:%M:%S UTC')}."
        )

    if not verify_password(login_data.password, user.hashed_password):
        # Increment failed attempts
        user.login_attempts += 1
        if user.login_attempts >= settings.max_login_attempts:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.lockout_minutes)
            user.login_attempts = 0 # Reset attempts after locking
        await db.commit()
        return None

    # Success: reset attempts and update last login
    user.login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    await db.commit()
    return user


async def create_staff_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new staff user (COFOUNDER only can do this)"""
    existing_user = await get_staff_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_refresh_token(db: AsyncSession, user_obj: Union[User, Intern], token: str):
    """Update hashed refresh token in DB"""
    user_obj.refresh_token_hash = hash_token(token)
    await db.commit()


async def get_current_user_data(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> dict:
    """Dependency to get current authenticated user or intern data from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    if not user_id or not user_type:
        raise credentials_exception
        
    if user_type == "staff":
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise credentials_exception
        return {"type": "staff", "obj": user}
        
    elif user_type == "intern":
        result = await db.execute(select(Intern).where(Intern.id == uuid.UUID(user_id)))
        intern = result.scalar_one_or_none()
        if not intern or not intern.is_active:
            raise credentials_exception
        return {"type": "intern", "obj": intern}
    
    raise credentials_exception


async def get_current_staff(
    data: dict = Depends(get_current_user_data)
) -> User:
    """Dependency to ensure current user is staff"""
    if data["type"] != "staff":
        raise HTTPException(status_code=403, detail="Forbidden: Staff access only")
    return data["obj"]


async def get_current_intern(
    data: dict = Depends(get_current_user_data)
) -> Intern:
    """Dependency to ensure current user is an intern"""
    if data["type"] != "intern":
        raise HTTPException(status_code=403, detail="Forbidden: Intern access only")
    return data["obj"]


async def get_any_active_user(
    data: dict = Depends(get_current_user_data)
) -> dict:
    """Dependency to get current authenticated user, either staff or intern"""
    return data


async def get_optional_user_data(
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[dict]:
    """Dependency that returns user data if a valid token is present, otherwise None.
    This allows public access to endpoints like job listings."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type")

        if not user_id or not user_type:
            return None

        if user_type == "staff":
            result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return {"type": "staff", "obj": user}

        elif user_type == "intern":
            result = await db.execute(select(Intern).where(Intern.id == uuid.UUID(user_id)))
            intern = result.scalar_one_or_none()
            if intern and intern.is_active:
                return {"type": "intern", "obj": intern}

        return None
    except Exception:
        return None


def require_role(allowed_roles: List[UserRole]):
    """Dependency factory for RBAC"""
    def role_checker(user: User = Depends(get_current_staff)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return user
    return role_checker
