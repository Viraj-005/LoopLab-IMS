import asyncio
from app.database import engine
from sqlalchemy import select
from app.models.application import Application
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_apps():
    async with engine.connect() as conn:
        result = await conn.execute(select(Application))
        apps = result.all()
        logger.info(f"Total applications in DB: {len(apps)}")
        for app in apps:
            logger.info(f"ID: {app.id}, Name: {app.applicant_name}, InternID: {app.intern_id}, Source: {app.source}, JobID: {app.job_id}")

if __name__ == "__main__":
    asyncio.run(debug_apps())
