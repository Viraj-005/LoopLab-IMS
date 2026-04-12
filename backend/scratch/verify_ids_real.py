import asyncio
import uuid
from datetime import datetime
from app.database import engine, get_db
from app.services.application_service import create_application
from app.schemas.application import ApplicationCreate
from app.models.application import Application, ApplicationSource
from app.models.job_post import JobPost
from app.models.intern import Intern
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_app_creation():
    async for db in get_db():
        logger.info("Fetching real IDs for verification...")
        
        # Get a real Job
        job_res = await db.execute(select(JobPost).limit(1))
        job = job_res.scalar_one_or_none()
        if not job:
            logger.error("No job posts in DB to test with!")
            return
            
        # Get a real Intern
        intern_res = await db.execute(select(Intern).limit(1))
        intern = intern_res.scalar_one_or_none()
        if not intern:
            logger.error("No interns in DB to test with!")
            return

        logger.info(f"Using Job ID: {job.id}, Intern ID: {intern.id}")
        
        app_in = ApplicationCreate(
            email="test_sync_real@example.com",
            applicant_name="Sync Tester Real",
            applied_role=job.title,
            job_id=job.id,
            intern_id=intern.id,
            source=ApplicationSource.PORTAL,
            received_at=datetime.utcnow()
        )
        
        app = await create_application(db, app_in)
        await db.commit()
        
        logger.info(f"Created App ID: {app.id}")
        
        # Fresh query
        result = await db.execute(select(Application).where(Application.id == app.id))
        db_app = result.scalar_one()
        logger.info(f"DB InternID: {db_app.intern_id}")
        logger.info(f"DB JobID: {db_app.job_id}")
        
        if db_app.intern_id == intern.id and db_app.job_id == job.id:
            logger.info("SUCCESS: IDs persisted in DB with real FKs.")
        else:
            logger.error(f"FAILURE: IDs mismatch. Expected {intern.id}, got {db_app.intern_id}")
        
        # Cleanup
        await db.delete(db_app)
        await db.commit()
        break

if __name__ == "__main__":
    asyncio.run(test_app_creation())
