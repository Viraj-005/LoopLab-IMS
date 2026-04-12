import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_database():
    async with engine.begin() as conn:
        logger.info("Starting comprehensive Staff table (users) schema fix...")
        
        # Comprehensive list of columns that should exist in 'users'
        columns_to_ensure = [
            ("oauth_provider", "VARCHAR(50)"),
            ("oauth_id", "VARCHAR(255)"),
            ("login_attempts", "INTEGER DEFAULT 0"),
            ("locked_until", "TIMESTAMP"),
            ("last_login", "TIMESTAMP"),
            ("password_changed_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("refresh_token_hash", "VARCHAR(255)")
        ]
        
        for col_name, col_type in columns_to_ensure:
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

        # Ensure hashed_password is nullable for OAuth users
        try:
             await conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
             logger.info("Ensured hashed_password is nullable.")
        except Exception as e:
             logger.warn(f"Note: Could not alter hashed_password (might already be nullable): {e}")

        logger.info("Database schema fix complete.")

if __name__ == "__main__":
    asyncio.run(fix_database())
