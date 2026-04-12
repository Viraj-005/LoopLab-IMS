import asyncio
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def inspect_enum():
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'userrole';
        """))
        labels = [row[0] for row in result]
        logger.info(f"Current labels for 'userrole' enum: {labels}")

if __name__ == "__main__":
    asyncio.run(inspect_enum())
