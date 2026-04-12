"""
OAuth Service
Handles external OAuth provider flows (Google)
"""
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.intern import Intern, OAuthProvider
from app.config import get_settings

settings = get_settings()

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


async def exchange_google_code(code: str) -> dict:
    """Exchange OAuth code for Google user info"""
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for access token
        data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }
        response = await client.post(GOOGLE_TOKEN_URL, data=data)
        if response.status_code != 200:
            error_data = response.json() if "application/json" in response.headers.get("Content-Type", "") else response.text
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google token exchange failed: {error_data}"
            )
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        # 2. Get user info
        headers = {"Authorization": f"Bearer {access_token}"}
        user_info_res = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        if user_info_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch user info from Google"
            )
        
        return user_info_res.json()


async def get_or_create_intern_from_google(db: AsyncSession, google_user: dict) -> Intern:
    """Upsert intern based on Google OAuth data (Applicants only)"""
    email = google_user.get("email")
    google_id = google_user.get("sub")
    first_name = google_user.get("given_name", "")
    last_name = google_user.get("family_name", "")
    picture = google_user.get("picture", "")

    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete data from Google"
        )

    # 1. Check for existing Intern by email
    result = await db.execute(select(Intern).where(Intern.email == email))
    intern = result.scalar_one_or_none()

    if intern:
        # Update existing intern
        intern.oauth_provider = OAuthProvider.GOOGLE
        intern.oauth_id = google_id
        intern.first_name = first_name or intern.first_name
        intern.last_name = last_name or intern.last_name
        intern.profile_picture_url = picture or intern.profile_picture_url
    else:
        # Create new intern
        intern = Intern(
            email=email,
            oauth_provider=OAuthProvider.GOOGLE,
            oauth_id=google_id,
            first_name=first_name,
            last_name=last_name,
            profile_picture_url=picture
        )
        db.add(intern)
    
    await db.commit()
    await db.refresh(intern)
    return intern
