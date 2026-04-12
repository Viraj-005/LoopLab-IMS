import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    print("Initiating intern profile schema expansion...")
    try:
        async with engine.begin() as conn:
            # Adding JSON columns for education and work history
            await conn.execute(text("ALTER TABLE interns ADD COLUMN IF NOT EXISTS education_history JSONB DEFAULT '[]';"))
            await conn.execute(text("ALTER TABLE interns ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';"))
            
            print("Successfully updated 'interns' table with dynamic history columns.")
    except Exception as e:
        print(f"Schema alignment failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
