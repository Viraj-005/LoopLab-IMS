"""
Security Service
Handles TOTP (2FA), Password Reset tokens, and secure verification logic
"""
import pyotp
import qrcode
import io
import base64
import secrets
from datetime import datetime, timedelta
from typing import Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.config import get_settings

settings = get_settings()

def generate_totp_secret() -> str:
    """Generates a new random TOTP secret"""
    return pyotp.random_base32()

def get_totp_uri(email: str, secret: str) -> str:
    """Generates a TOTP provisioning URI for QR code"""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email, 
        issuer_name=settings.company_name
    )

def generate_qr_code_base64(uri: str) -> str:
    """Generates a base64 encoded QR code image from a URI"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifies a 6-digit TOTP code against a secret"""
    totp = pyotp.totp.TOTP(secret)
    # CRITICAL: PyOTP has a bug where it uses the naive local time by default, resulting in
    # a massive timezone offset (e.g., +5:30) if the server is not in UTC. 
    # We must explicitly pass a UTC-aware datetime to ensure accurate epoch generation.
    import datetime
    true_utc_now = datetime.datetime.now(datetime.timezone.utc)
    
    # Allow 2 time slots before and after (approx +/- 60 seconds) to account for slight clock skews
    return totp.verify(code, valid_window=2, for_time=true_utc_now)


def generate_reset_token() -> Tuple[str, datetime]:
    """Generates a secure 6-digit reset code and expiry time"""
    # Using a 6-digit code which is easy for users to type from email
    token = "".join(secrets.choice("0123456789") for _ in range(6))
    expires = datetime.utcnow() + timedelta(minutes=15)
    return token, expires

async def get_user_by_reset_token(db: AsyncSession, token: str) -> Optional[User]:
    """Finds a user by valid, non-expired reset token"""
    query = select(User).where(
        User.reset_token == token,
        User.reset_token_expires > datetime.utcnow()
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()
