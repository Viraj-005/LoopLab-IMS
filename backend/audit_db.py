import asyncio
from sqlalchemy import text
from app.database import engine

async def full_audit():
    async with engine.connect() as conn:
        res = await conn.execute(text("""
            SELECT 
                n.nspname as schema_name,
                t.relname as table_name,
                a.attname as column_name
            FROM 
                pg_class t
            JOIN 
                pg_attribute a ON a.attrelid = t.oid
            JOIN 
                pg_namespace n ON n.oid = t.relnamespace
            WHERE 
                t.relname = 'interns'
                AND a.attnum > 0
                AND n.nspname NOT IN ('pg_catalog', 'information_schema');
        """))
        rows = res.all()
        for row in rows:
            print(f"{row.schema_name}.{row.table_name}.{row.column_name}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(full_audit())
