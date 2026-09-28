import os
from pydantic_settings import BaseSettings # type: ignore


class Settings(BaseSettings):
    PROJECT_NAME: str = "PrAmazon"
    API_V1_STR: str = "/api/v1"
    
    # 32+ bytes cryptographic secret key for signing JWT tokens
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "pramazon_super_secret_jwt_key_2026_production_grade_32_bytes_min"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
