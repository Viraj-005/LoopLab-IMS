import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_database():
    async with engine.begin() as conn:
        logger.info("Starting database schema fix for Staff OAuth...")
        
        # Add OAuth columns to 'users' table
        columns_to_add = [
            ("oauth_provider", "VARCHAR(50)"),
            ("oauth_id", "VARCHAR(255)")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists first
                check_sql = text(f"SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='{col_name}'")
                res = await conn.execute(check_sql)
                if not res.scalar():
                    logger.info(f"Adding column '{col_name}' to 'users' table...")
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                else:
                    logger.info(f"Column '{col_name}' already exists in 'users' table.")
            except Exception as e:
                logger.error(f"Error adding column {col_name} to users: {e}")

        # Also ensures hashed_password can be NULL for users table
        try:
             logger.info("Setting hashed_password to nullable in 'users' table...")
             await conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
        except Exception as e:
             logger.error(f"Error making hashed_password nullable: {e}")

        logger.info("Database schema fix complete.")

if __name__ == "__main__":
    asyncio.run(fix_database())
