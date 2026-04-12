import asyncio
from sqlalchemy import text
from app.database import engine

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='interns';"))
        columns = res.scalars().all()
        print(f"Columns in 'interns' table: {columns}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
