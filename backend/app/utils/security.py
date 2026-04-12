"""
Security Utilities
JWT tokens and password hashing
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Any, Union, Dict
from jose import jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def hash_token(token: str) -> str:
    """Hash a refresh token for storage in DB"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(
    subject: Union[str, Any], 
    user_type: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "type": "access",
        "user_type": user_type, # 'staff' or 'intern'
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create a unique random refresh token"""
    # We use a random string instead of a JWT for refresh tokens to simplify invalidation
    # and storage. We will hash this before storing in the database.
    token = secrets.token_urlsafe(64)
    return token


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except Exception:
        return {}


def is_password_strong(password: str) -> bool:
    """Basic password strength check"""
    if len(password) < 8:
        return False
    if not any(char.isdigit() for char in password):
        return False
    if not any(char.isupper() for char in password):
        return False
    return True
