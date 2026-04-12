import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_database():
    async with engine.begin() as conn:
        logger.info("Starting database schema fix...")
        
        # 1. Ensure 'interns' table exists (it should have been created by init_db, but good to check)
        # We can just let init_db handle table creation, but it won't handle missing columns.
        
        # 2. Add missing columns to 'applications' table
        columns_to_add = [
            ("job_id", "UUID REFERENCES job_posts(id)"),
            ("intern_id", "UUID REFERENCES interns(id)"),
            ("cover_letter_path", "VARCHAR(500)"),
            ("cover_letter_original_filename", "VARCHAR(255)")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists first
                check_sql = text(f"SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='{col_name}'")
                res = await conn.execute(check_sql)
                if not res.scalar():
                    logger.info(f"Adding column '{col_name}' to 'applications' table...")
                    await conn.execute(text(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}"))
                else:
                    logger.info(f"Column '{col_name}' already exists in 'applications' table.")
            except Exception as e:
                logger.error(f"Error adding column {col_name}: {e}")

        logger.info("Database schema fix complete.")

if __name__ == "__main__":
    asyncio.run(fix_database())
