"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/advanced_systems"
    SECRET_KEY: str = "change-me-in-production"
    ADMIN_API_KEY: str = "ADVANCED_SYSTEMS_ADMIN"
    MEILISEARCH_URL: str = "http://localhost:7700"
    MEILISEARCH_API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://advancedsystems-int.com"]
    UPLOADS_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB

    class Config:
        env_file = ".env"


settings = Settings()
