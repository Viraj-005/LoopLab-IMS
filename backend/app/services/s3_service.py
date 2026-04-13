import boto3
from botocore.exceptions import ClientError
from typing import Optional, Literal
import logging
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket_name = settings.s3_bucket_name
        self.region = settings.aws_region
        
        # Initialize client if credentials exist
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=self.region
            )
            self.enabled = True
        else:
            self.s3_client = None
            self.enabled = False
            logger.warning("AWS S3 credentials not provided. S3Service will be disabled (Falling back to local).")

    async def upload_file(
        self, 
        file_content: bytes, 
        object_name: str, 
        content_type: str,
        acl: Literal['public-read', 'private'] = 'public-read'
    ) -> Optional[str]:
        """
        Uploads a file to S3 and returns the URL.
        If acl is 'private', it still returns the URL but the file won't be accessible without a presigned URL.
        """
        if not self.enabled:
            return None
            
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_content,
                ContentType=content_type,
                ACL=acl
            )
            # Return the direct S3 URL
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{object_name}"
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {e}")
            return None

    def get_presigned_url(self, object_name: str, expires_in: int = 3600) -> Optional[str]:
        """Generates a presigned URL to share a private S3 object"""
        if not self.enabled:
            return None
            
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expires_in
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None

    async def delete_file(self, object_name: str) -> bool:
        """Deletes a file from S3"""
        if not self.enabled:
            return False
            
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            return True
        except ClientError as e:
            logger.error(f"Failed to delete from S3: {e}")
            return False

# Dependency instance
s3_service = S3Service()
