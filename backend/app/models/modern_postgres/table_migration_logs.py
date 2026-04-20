# app/models/modern_postgres/table_migration_logs.py
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.core.db_modern_postgres import BaseModern

class MigrationLog(BaseModern):
    __tablename__ = "migration_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="IN_PROGRESS", nullable=False)
    total_records = Column(Integer, default=0)
    migrated_records = Column(Integer, default=0)
    skipped_records = Column(Integer, default=0)
    error_message = Column(String(1000), nullable=True)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)