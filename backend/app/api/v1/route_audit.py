# app/api/v1/route_audit.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import get_current_user, RoleChecker
from app.models.modern_postgres.table_user import User, UserRole
from app.models.modern_postgres.table_audit_log import AuditLog
from app.schemas.schema_audit_log import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["System Audit & Compliance"])

# Only Admins and HR Managers can view audit logs
allow_compliance_officers = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])

@router.get("/", response_model=List[AuditLogResponse], dependencies=[Depends(allow_compliance_officers)])
def get_system_audit_logs(
    table_name: str = Query(None, description="Filter by specific table (e.g., payrolls, employees)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the chronological audit trail. 
    Essential for compliance in regulated payroll environments.
    """
    query = db.query(AuditLog)
    
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
        
    logs = query.order_by(AuditLog.changed_at.desc()).offset(offset).limit(limit).all()
    return logs