import asyncio
from app.database import engine, AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import get_password_hash
from app.config import get_settings
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

async def create_default_admin():
    async with AsyncSessionLocal() as db:
        logger.info("Checking for existing admin user...")
        
        # Check if admin already exists
        email = settings.admin_email
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.info(f"Admin user '{email}' already exists. Updating password...")
            existing_user.hashed_password = get_password_hash(settings.admin_password)
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
        else:
            logger.info(f"Creating new admin user '{email}'...")
            new_admin = User(
                email=email,
                full_name="System Administrator",
                hashed_password=get_password_hash(settings.admin_password),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(new_admin)
        
        await db.commit()
        logger.info("Admin user setup complete.")
        logger.info(f"Credentials -> Email: {email} | Password: {settings.admin_password}")

if __name__ == "__main__":
    asyncio.run(create_default_admin())
