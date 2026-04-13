import sys
import os
# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.s3_service import s3_service
    print(f"S3Service initialized. Enabled: {s3_service.enabled}")
    
    from app.utils.file_utils import save_upload_file
    print("file_utils.save_upload_file imported successfully.")
    
    print("Testing local fallback check...")
    if not s3_service.enabled:
        print("Note: S3 is disabled (expected if no keys in .env). Local fallback will be used.")
    
    print("SUCCESS: Integrity check passed.")
except Exception as e:
    print(f"FAILURE: Integrity check failed: {e}")
    sys.exit(1)
