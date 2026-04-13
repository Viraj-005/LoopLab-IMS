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
from app.services.s3_service import s3_service

settings = get_settings()

os.makedirs(settings.upload_dir, exist_ok=True)


async def save_upload_file(
    upload_file: UploadFile, 
    custom_filename: str = None, 
    is_private: bool = False
) -> tuple[str, str]:
    """
    Save uploaded file to S3 (if enabled) or local disk.
    Returns (url_or_path, file_hash)
    """
    file_content = await upload_file.read()
    file_ext = Path(upload_file.filename).suffix
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Generate filename
    save_filename = custom_filename or f"{file_hash}{file_ext}"
    content_type = upload_file.content_type or get_file_content_type(save_filename)
    
    # 1. Try S3 first
    if s3_service.enabled:
        acl = 'private' if is_private else 'public-read'
        s3_url = await s3_service.upload_file(
            file_content=file_content,
            object_name=save_filename,
            content_type=content_type,
            acl=acl
        )
        if s3_url:
            await upload_file.seek(0)
            return s3_url, file_hash

    # 2. Local Fallback
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, save_filename)
    
    if not os.path.exists(file_path):
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(file_content)
            
    await upload_file.seek(0)
    # For local storage, we return the relative path starting with /uploads/ 
    # so the frontend getMediaUrl can handle it
    relative_path = f"/uploads/{save_filename}"
    return relative_path, file_hash


def get_media_presigned_url(path: str, expires_in: int = 3600) -> str:
    """
    If path is an S3 URL, return a presigned URL.
    Otherwise return the path as is (for local fallback).
    """
    if path and path.startswith('http'):
        # Extract object name from URL
        object_name = path.split('/')[-1]
        presigned = s3_service.get_presigned_url(object_name, expires_in=expires_in)
        return presigned or path
    return path


def get_file_content_type(file_path: str) -> str:
    """Guess content type"""
    import mimetypes
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or "application/octet-stream"
