import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Virtual Tours API"
    API_V1_STR: str = "/api/v1"
    
    # Storage paths
    TOURS_DIR: str = os.getenv("TOURS_DIR", "/app/tours")
    COVERS_DIR: str = os.getenv("COVERS_DIR", "/app/covers")
    
    # Upload limits
    MAX_COVER_SIZE: int = 10 * 1024 * 1024  # 10 MB
    MAX_TOUR_SIZE: int = 100 * 1024 * 1024  # 100 MB
    
    ALLOWED_COVER_EXTENSIONS: set = {"jpg", "jpeg", "png", "gif", "webp"}
    ALLOWED_TOUR_EXTENSIONS: set = {"zip"}

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]  # For development, tighten in prod

    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-it")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.TOURS_DIR, exist_ok=True)
os.makedirs(settings.COVERS_DIR, exist_ok=True)
