import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_job_posts():
    async with engine.begin() as conn:
        logger.info("Starting job_posts table migration...")
        
        # Add media_url column if it doesn't exist
        try:
            # Check if column exists first
            check_sql = text("SELECT 1 FROM information_schema.columns WHERE table_name='job_posts' AND column_name='media_url'")
            res = await conn.execute(check_sql)
            if not res.scalar():
                logger.info("Adding column 'media_url' to 'job_posts' table...")
                await conn.execute(text("ALTER TABLE job_posts ADD COLUMN media_url VARCHAR(500)"))
            else:
                logger.info("Column 'media_url' already exists.")
        except Exception as e:
            logger.error(f"Error migrating job_posts: {e}")

        logger.info("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate_job_posts())
