# app/models/modern_postgres/table_audit_log.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from app.core.db_modern_postgres import BaseModern

class AuditLog(BaseModern):
    """
    Strict compliance requirement for regulated financial and payroll systems.
    Tracks exactly what changed, who changed it, and when.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    
    action = Column(String(50), nullable=False) # INSERT, UPDATE, DELETE, MIGRATE
    
    # JSONB is perfect for storing the 'Before' and 'After' state of the row
    old_data = Column(JSONB, nullable=True)
    new_data = Column(JSONB, nullable=True)
    
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)