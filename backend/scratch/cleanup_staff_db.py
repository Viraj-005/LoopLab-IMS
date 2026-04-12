import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_staff_db():
    async with engine.begin() as conn:
        logger.info("Starting staff table cleanup and optimization...")
        
        # 1. Ensure 'ADMIN' is in the DB enum type if not already
        try:
            # PostgreSQL specific: ADD VALUE to ENUM
            # Note: This cannot run inside a transaction block in some PG versions, 
            # but we are using engine.begin(). If it fails, we'll try a different way.
            await conn.execute(text("COMMIT")) # End current transaction
            await conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'ADMIN'"))
            logger.info("Ensured 'ADMIN' exists in PostgreSQL enum type 'userrole'.")
        except Exception as e:
            logger.info(f"Note: Could not alter enum type (might already exist or permission issue): {e}")

        # 2. Drop OAuth columns
        columns_to_drop = ["oauth_provider", "oauth_id"]
        for col in columns_to_drop:
            try:
                await conn.execute(text(f"ALTER TABLE users DROP COLUMN IF EXISTS {col}"))
                logger.info(f"Dropped column '{col}' from 'users' table.")
            except Exception as e:
                logger.error(f"Error dropping column {col}: {e}")

        # 3. Ensure hashed_password is NOT NULL
        # First, set a fallback for any accounts that might have NULL (e.g. from our previous OAuth test)
        try:
            await conn.execute(text("UPDATE users SET hashed_password = 'OAUTH_ONLY_REVERT_REQUIRED' WHERE hashed_password IS NULL"))
            await conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password SET NOT NULL"))
            logger.info("Restored NOT NULL constraint on 'hashed_password'.")
        except Exception as e:
            logger.error(f"Error restoring password constraint: {e}")

        logger.info("Database cleanup complete.")

if __name__ == "__main__":
    asyncio.run(cleanup_staff_db())
