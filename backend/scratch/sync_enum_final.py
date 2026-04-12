import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_enum_labels():
    async with engine.connect() as conn:
        logger.info("Synchronizing 'userrole' enum labels with Python model...")
        
        # Labels that MUST exist to match UserRole enum
        required_labels = ['HR', 'COFOUNDER']
        
        # Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction.
        # SQLAlchemy's engine.connect() might be inside one depending on setup.
        # We use raw connection if needed, but 'IF NOT EXISTS' helps.
        
        for label in required_labels:
            try:
                # We use a trick to run ALTER TYPE outside of a transaction if possible
                # or just try to add it. 
                # PostgreSQL 12+ supports IF NOT EXISTS for ADD VALUE
                await conn.execute(text("COMMIT")) # Try to end current transaction if any
                await conn.execute(text(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{label}'"))
                logger.info(f"Ensured '{label}' exists in 'userrole' enum.")
            except Exception as e:
                logger.error(f"Error adding label {label}: {e}")

        logger.info("Enum synchronization complete.")

if __name__ == "__main__":
    asyncio.run(fix_enum_labels())
