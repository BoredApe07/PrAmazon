import os
from pathlib import Path
from pydantic_settings import BaseSettings  # type: ignore

# Ensure .env is always located inside the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "PrAmazon"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL Database Connection Strings
    # Strictly loaded from .env - NEVER hardcode credentials in source code!
    DATABASE_URL: str = ""
    DATABASE_URL_POOLED: str = ""

    # Upstash Redis Connection String
    # Strictly loaded from .env - NEVER hardcode credentials in source code!
    REDIS_URL: str = ""

    # Cryptographic JWT Security Settings
    # Strictly loaded from .env - NEVER hardcode secret keys in source code!
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    class Config:
        env_file = str(ENV_PATH)
        case_sensitive = True


settings = Settings()

