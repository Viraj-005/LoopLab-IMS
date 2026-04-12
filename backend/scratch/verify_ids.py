import asyncio
import uuid
from datetime import datetime
from app.database import engine, get_db
from app.services.application_service import create_application
from app.schemas.application import ApplicationCreate
from app.models.application import Application, ApplicationSource
from sqlalchemy import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_app_creation():
    async for db in get_db():
        logger.info("Testing explicitly assigned IDs in create_application...")
        
        # We'll use a random UUID for test (won't actually FK check unless we have seeds, 
        # but let's see if SQLALchemy accepts them in the object)
        test_intern_id = uuid.uuid4()
        test_job_id = uuid.uuid4()
        
        app_in = ApplicationCreate(
            email="test_sync@example.com",
            applicant_name="Sync Tester",
            applied_role="QA Engineer",
            job_id=test_job_id,
            intern_id=test_intern_id,
            source=ApplicationSource.PORTAL,
            received_at=datetime.utcnow()
        )
        
        app = await create_application(db, app_in)
        
        logger.info(f"Created App ID: {app.id}")
        logger.info(f"App InternID: {app.intern_id}")
        logger.info(f"App JobID: {app.job_id}")
        
        if app.intern_id == test_intern_id and app.job_id == test_job_id:
            logger.info("SUCCESS: IDs preserved in object.")
        else:
            logger.error("FAILURE: IDs lost in object.")
            
        # Verify in DB (refreshing session first)
        await db.commit()
        
        # Check in DB
        result = await db.execute(select(Application).where(Application.id == app.id))
        db_app = result.scalar_one()
        logger.info(f"DB InternID: {db_app.intern_id}")
        logger.info(f"DB JobID: {db_app.job_id}")
        
        if db_app.intern_id == test_intern_id and db_app.job_id == test_job_id:
            logger.info("SUCCESS: IDs persisted in DB.")
        else:
            logger.error("FAILURE: IDs lost in DB.")
        
        # Cleanup
        await db.delete(db_app)
        await db.commit()
        break

if __name__ == "__main__":
    asyncio.run(test_app_creation())
