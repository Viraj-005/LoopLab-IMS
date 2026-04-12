import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    print("Initiating protocol schema alignment...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS tags VARCHAR(500);"))
            print("Successfully added 'tags' column to 'job_posts' table.")
    except Exception as e:
        print(f"Schema alignment failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
