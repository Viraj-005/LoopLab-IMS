"""
System Settings Service
Handles fetching and updating global settings
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import SystemSettings
from app.schemas.settings import SystemSettingsUpdate


async def get_system_settings(db: AsyncSession) -> SystemSettings:
    """Gets the current settings or creates default if not exists"""
    result = await db.execute(select(SystemSettings))
    settings = result.scalars().first()
    
    if not settings:
        # Initialize default settings
        settings = SystemSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings


async def update_system_settings(
    db: AsyncSession, 
    settings_in: SystemSettingsUpdate
) -> SystemSettings:
    """Updates global settings"""
    settings = await get_system_settings(db)
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
        
    await db.commit()
    await db.refresh(settings)
    return settings
