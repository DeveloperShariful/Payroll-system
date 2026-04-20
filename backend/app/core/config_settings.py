# app/core/config_settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, Field
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Labor Payroll Migration API"
    PROJECT_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")

    # Modern PostgreSQL Database Configuration (NeonDB/AWS)
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    
    # MS SQL Server Legacy Database Configuration (For reading old MS Access data)
    LEGACY_MSSQL_URL: str = Field(..., description="Connection string for legacy MS SQL Server via PyODBC")

    # Security & Authentication (JWT Secrets for later use)
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def modern_database_url(self) -> str:
        # Auto-construct PostgreSQL URL from parts to ensure correct formatting
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}?sslmode=require"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

# Instantiate settings to be used across the app
settings = Settings()