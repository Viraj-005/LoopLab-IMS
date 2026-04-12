import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    print("Initiating security schema alignment...")
    try:
        async with engine.begin() as conn:
            # Adding 2FA and Password Reset columns to the users table
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;"))
            
            print("Successfully updated 'users' table with security columns.")
    except Exception as e:
        print(f"Schema alignment failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
