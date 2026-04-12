import asyncio
from app.database import engine, AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import get_password_hash
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_default_admin():
    async with AsyncSessionLocal() as db:
        logger.info("Checking for existing admin user...")
        
        # Check if admin already exists
        email = "admin@looplab.io"
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.info(f"Admin user '{email}' already exists. Updating password...")
            existing_user.hashed_password = get_password_hash("AdminPassword123!")
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
        else:
            logger.info(f"Creating new admin user '{email}'...")
            new_admin = User(
                email=email,
                full_name="System Administrator",
                hashed_password=get_password_hash("AdminPassword123!"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(new_admin)
        
        await db.commit()
        logger.info("Admin user setup complete.")
        logger.info(f"Credentials -> Email: {email} | Password: AdminPassword123!")

if __name__ == "__main__":
    asyncio.run(create_default_admin())
