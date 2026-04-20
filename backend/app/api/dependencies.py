# app/api/dependencies.py
from typing import Generator
from app.core.db_modern_postgres import ModernSessionLocal
from app.core.db_legacy_mssql import LegacySessionLocal

def get_modern_db() -> Generator:
    """
    Dependency to yield a Modern PostgreSQL database session.
    Closes the session automatically after the request finishes.
    """
    db = ModernSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_legacy_db() -> Generator:
    """
    Dependency to yield a Legacy MS SQL database session.
    Used specifically for migration or reading old access records.
    """
    legacy_db = LegacySessionLocal()
    try:
        yield legacy_db
    finally:
        legacy_db.close()