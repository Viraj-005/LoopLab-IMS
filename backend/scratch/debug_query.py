import asyncio
from app.database import engine, get_db
from sqlalchemy import select, func
from app.models.job_post import JobPost
from app.models.application import Application
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_query():
    # We need a session
    from sqlalchemy.ext.asyncio import AsyncSession
    async with AsyncSession(engine) as db:
        try:
            app_count_sub = (
                select(
                    Application.job_id,
                    func.count(Application.id).label("count")
                )
                .group_by(Application.job_id)
                .subquery()
            )

            query = (
                select(
                    JobPost,
                    func.coalesce(app_count_sub.c.count, 0).label("application_count")
                )
                .outerjoin(app_count_sub, JobPost.id == app_count_sub.c.job_id)
            )
            
            result = await db.execute(query)
            rows = result.all()
            logger.info(f"Retrieved {len(rows)} rows")
            
            for job, count in rows:
                logger.info(f"Job: {job.title}, Count: {count}")
                job.application_count = count
                logger.info(f"Attached count: {job.application_count}")
                
        except Exception as e:
            logger.error(f"Error executing debug query: {e}", exc_info=True)

if __name__ == "__main__":
    asyncio.run(debug_query())
