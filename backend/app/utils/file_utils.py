"""
File Utils
Handling file uploads and hashing
"""
import aiofiles
import hashlib
import os
import shutil
from pathlib import Path
from fastapi import UploadFile
from app.config import get_settings

settings = get_settings()

os.makedirs(settings.upload_dir, exist_ok=True)


async def save_upload_file(upload_file: UploadFile) -> tuple[str, str]:
    """
    Save uploaded file to disk and return (file_path, file_hash)
    """
    file_ext = Path(upload_file.filename).suffix
    file_content = await upload_file.read()
    
    # Calculate SHA-256 hash
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Generate unique filename using hash
    # We use the hash as the filename to avoid duplication on disk too
    save_filename = f"{file_hash}{file_ext}"
    file_path = os.path.join(settings.upload_dir, save_filename)
    
    # Write to disk if it doesn't exist
    if not os.path.exists(file_path):
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(file_content)
            
    # Reset cursor for potential further use
    await upload_file.seek(0)
    
    return file_path, file_hash


def get_file_content_type(file_path: str) -> str:
    """Guess content type"""
    import mimetypes
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or "application/octet-stream"
