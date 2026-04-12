import asyncio
from sqlalchemy import text
from app.database import engine
from app.config import get_settings

async def debug_migrate():
    settings = get_settings()
    print(f"Connecting to: {settings.database_url}")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE interns ADD COLUMN IF NOT EXISTS education_history JSONB DEFAULT '[]';"))
            await conn.execute(text("ALTER TABLE interns ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';"))
            print("Successfully verified/added columns.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_migrate())
