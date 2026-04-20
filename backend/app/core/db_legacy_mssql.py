# app/core/db_legacy_mssql.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config_settings import settings

# Base arguments for the database engine
engine_kwargs = {
    "pool_pre_ping": True,
}

# 1000% Real-World Logic: Dynamically adjust settings based on the database type
if settings.LEGACY_MSSQL_URL.startswith("mssql"):
    # These settings are EXCLUSIVELY for the client's MS SQL Server (Production)
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["fast_executemany"] = True  # CRITICAL for MS SQL Server performance during bulk operations
    
elif settings.LEGACY_MSSQL_URL.startswith("sqlite"):
    # These settings are for local testing on your PC
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Create the engine dynamically
LEGACY_ENGINE = create_engine(settings.LEGACY_MSSQL_URL, **engine_kwargs)

LegacySessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=LEGACY_ENGINE
)

# All legacy models will inherit from this Base
BaseLegacy = declarative_base()