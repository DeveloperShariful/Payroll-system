# app/schemas/schema_audit_log.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogBase(BaseModel):
    table_name: str
    record_id: int
    action: str
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    changed_by_user_id: Optional[int] = None

class AuditLogCreate(AuditLogBase):
    """Internal schema used by services to automatically log actions"""
    pass

class AuditLogResponse(AuditLogBase):
    """Schema for exposing audit history to Admin/HR via the API"""
    id: int
    changed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)