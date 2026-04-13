import sys
import os
import boto3
from botocore.exceptions import ClientError

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.s3_service import s3_service
    from app.config import get_settings
    
    settings = get_settings()
    print(f"--- Settings Check ---")
    print(f"S3 Bucket: {settings.s3_bucket_name}")
    print(f"S3 Region: {settings.aws_region}")
    print(f"Service Enabled: {s3_service.enabled}")
    
    if not s3_service.enabled:
        print("FAILURE: S3 Service is still disabled. Check if .env is being loaded correctly.")
        sys.exit(1)
        
    print(f"\n--- AWS Connection Test ---")
    try:
        # Try a simple list operation to verify credentials
        client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        response = client.list_objects_v2(Bucket=settings.s3_bucket_name, MaxKeys=1)
        print("SUCCESS: Connection to S3 verified! Credentials are valid.")
    except ClientError as e:
        print(f"FAILURE: AWS Connection failed: {e}")
    except Exception as e:
        print(f"FAILURE: An error occurred: {e}")

except Exception as e:
    print(f"FAILURE: Integrity check failed: {e}")
    sys.exit(1)
