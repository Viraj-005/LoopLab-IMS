import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def add_source_column():
    async with engine.begin() as conn:
        logger.info("Adding 'source' column to 'applications' table...")
        
        try:
            # Add the column as VARCHAR for robustness
            check_col = text("SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='source'")
            res = await conn.execute(check_col)
            if not res.scalar():
                logger.info("Adding source column as VARCHAR...")
                # Add with default 'manual'
                await conn.execute(text("ALTER TABLE applications ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'manual'"))
            else:
                logger.info("Column 'source' already exists.")
                
        except Exception as e:
            logger.error(f"Error: {e}")
            # Fallback if enum fails: Add as VARCHAR
            try:
                logger.info("Attempting to add 'source' as VARCHAR as fallback...")
                await conn.execute(text("ALTER TABLE applications ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'manual'"))
            except Exception as e2:
                logger.error(f"Fallback failed: {e2}")

        logger.info("Done.")

if __name__ == "__main__":
    asyncio.run(add_source_column())
