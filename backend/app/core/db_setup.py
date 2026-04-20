# app/core/db_setup.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator

from app.core.config_settings import settings

# =====================================================================
# 1. MODERN POSTGRESQL SETUP (Production Enterprise DB)
# =====================================================================
MODERN_ENGINE = create_engine(
    settings.modern_database_url,
    pool_pre_ping=True,      
    pool_size=20,            
    max_overflow=10,         
    pool_timeout=30,         
    echo=False               
)

ModernSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=MODERN_ENGINE
)

BaseModern = declarative_base()


# =====================================================================
# 2. LEGACY MS SQL SERVER SETUP (For Access DB Migration)
# =====================================================================
engine_kwargs = {
    "pool_pre_ping": True,
}

if settings.LEGACY_MSSQL_URL.startswith("mssql"):
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["fast_executemany"] = True  
elif settings.LEGACY_MSSQL_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

LEGACY_ENGINE = create_engine(settings.LEGACY_MSSQL_URL, **engine_kwargs)

LegacySessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=LEGACY_ENGINE
)

BaseLegacy = declarative_base()


# =====================================================================
# 3. DATABASE SESSION DEPENDENCIES (Yielders)
# =====================================================================
def get_modern_db() -> Generator:
    """Dependency to yield a Modern PostgreSQL database session."""
    db = ModernSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_legacy_db() -> Generator:
    """Dependency to yield a Legacy MS SQL database session."""
    legacy_db = LegacySessionLocal()
    try:
        yield legacy_db
    finally:
        legacy_db.close()