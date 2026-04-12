"""
Timeline Service
Manage application history events
"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.timeline import ApplicationTimeline, ActionType, PerformerType

async def add_timeline_entry(
    db: AsyncSession,
    application_id: UUID,
    action_type: ActionType,
    description: str,
    performed_by: str = "System",
    performer_type: PerformerType = PerformerType.SYSTEM
) -> ApplicationTimeline:
    """
    Add a new entry to the application timeline
    """
    entry = ApplicationTimeline(
        application_id=application_id,
        action_type=action_type,
        description=description,
        performed_by=performed_by,
        performer_type=performer_type
    )
    db.add(entry)
    # We usually don't commit here to allow atomic transactions with the caller
    # But if called independently, the caller must commit.
    return entry
