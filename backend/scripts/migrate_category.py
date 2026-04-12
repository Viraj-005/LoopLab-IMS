import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Starting migration: Changing category column type...")
        # Postgres specific: Convert Enum to Text/Varchar
        await conn.execute(text("ALTER TABLE job_posts ALTER COLUMN category TYPE VARCHAR(100) USING category::TEXT;"))
        print("Migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(migrate())
