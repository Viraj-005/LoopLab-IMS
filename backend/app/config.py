"""
IMS Backend - Configuration Module
Loads settings from environment variables
"""
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    db_name: str = "IMS"
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432

    # JWT Settings
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15       # Short-lived
    refresh_token_expire_days: int = 7          # Longer-lived refresh
    
    # Initial Admin Setup
    admin_email: str = "virajinduruwa@looplab.lk"
    admin_password: str = "Viraj@LoopLab#888"

    # Security / Lockout
    max_login_attempts: int = 5
    lockout_minutes: int = 15

    # AWS S3 Settings
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = ""

    # SMTP Configuration (Replacing Mailgun)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "looplab888@gmail.com"

    # Company Branding
    company_name: str = "LOOPLAB"

    # File Storage
    upload_dir: str = "uploads"
    max_file_size_mb: int = 10

    # CORS
    frontend_url: str = "http://localhost:5173"

    # Google OAuth (Intern Login)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:5173/auth/callback/google"

    env_database_url: str | None = Field(default=None, alias="database_url")

    @property
    def database_url(self) -> str:
        if self.env_database_url:
            return self.env_database_url
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def sync_database_url(self) -> str:
        if self.env_database_url:
            return self.env_database_url.replace("+asyncpg", "")
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
