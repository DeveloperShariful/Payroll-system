# app/core/db_modern_postgres.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config_settings import settings

# Connection Pooling is strictly required for Enterprise apps to prevent "Too many connections" error.
MODERN_ENGINE = create_engine(
    settings.modern_database_url,
    pool_pre_ping=True,      # Checks connection health before using it
    pool_size=20,            # Standard for medium-heavy web apps
    max_overflow=10,         # Allows 10 extra connections if pool is full
    pool_timeout=30,         # Wait 30 seconds before throwing timeout error
    echo=False               # Set True only for debugging generated SQL
)

ModernSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=MODERN_ENGINE
)

# All modern models will inherit from this Base
BaseModern = declarative_base()