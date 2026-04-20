# app/services/service_migration.py
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.db_setup import get_legacy_db, get_modern_db
from app.models.legacy_mssql.ms_access_200_cols import LegacyEmployeeMaster
from app.models.models_core import Department, MigrationLog
from app.models.models_profiles import Employee

# =====================================================================
# 1. MS ACCESS PARSERS (Handling legacy corrupt/dirty data)
# =====================================================================
def clean_ms_access_boolean(value: Any) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in ['yes', 'true', '1', 'y']
    if isinstance(value, (int, float)):
        return value != 0
    return bool(value)

def parse_legacy_date(date_str: Any) -> datetime | None:
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        return datetime.strptime(str(date_str).strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None

def sanitize_legacy_string(value: Any) -> str:
    if value is None:
        return ""
    return str(value).replace('\x00', '').strip()

# =====================================================================
# 2. DYNAMIC ETL MAPPER (Splitting 200+ columns into Core & JSONB)
# =====================================================================
class DynamicETLMapper:
    @staticmethod
    def extract_and_split_legacy_record(legacy_record: Any, core_fields: List[str]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        full_record_dict = {
            column.name: getattr(legacy_record, column.name) 
            for column in legacy_record.__table__.columns
        }

        core_data = {}
        for field in core_fields:
            if field in full_record_dict:
                core_data[field] = full_record_dict.pop(field)

        dynamic_attributes = full_record_dict
        return core_data, dynamic_attributes

# =====================================================================
# 3. CORE BATCH MIGRATION LOGIC
# =====================================================================
def run_employee_migration_batch(legacy_db: Session, modern_db: Session, batch_size: int, batch_id: str):
    log_entry = MigrationLog(batch_id=batch_id, status="IN_PROGRESS", total_records=batch_size)
    modern_db.add(log_entry)
    modern_db.commit()

    try:
        legacy_records = legacy_db.query(LegacyEmployeeMaster).yield_per(batch_size).limit(batch_size).all()
        
        migrated_count = 0
        skipped_count = 0

        default_dept = modern_db.query(Department).filter(Department.department_code == "MIG-01").first()
        if not default_dept:
            default_dept = Department(name="Legacy Migrated Dept", department_code="MIG-01")
            modern_db.add(default_dept)
            modern_db.commit()
            modern_db.refresh(default_dept)

        core_mapping = ["EmpID_PK", "F_Name", "L_Name", "Email_Addr", "Date_Of_Hire", "Is_Active_Status_YN"]

        for old_record in legacy_records:
            core_data, dynamic_json_payload = DynamicETLMapper.extract_and_split_legacy_record(old_record, core_mapping)
            
            emp_id = sanitize_legacy_string(core_data.get("EmpID_PK"))
            
            exists = modern_db.query(Employee).filter(Employee.legacy_id == emp_id).first()
            if exists:
                skipped_count += 1
                continue

            hire_date_parsed = parse_legacy_date(core_data.get("Date_Of_Hire"))
            is_active_parsed = clean_ms_access_boolean(core_data.get("Is_Active_Status_YN"))

            new_employee = Employee(
                legacy_id=emp_id,
                first_name=sanitize_legacy_string(core_data.get("F_Name", "Unknown")),
                last_name=sanitize_legacy_string(core_data.get("L_Name", "Unknown")),
                email=sanitize_legacy_string(core_data.get("Email_Addr", f"migrated_{emp_id}@legacy.com")),
                hire_date=hire_date_parsed if hire_date_parsed else datetime.strptime("2000-01-01", "%Y-%m-%d"),
                is_active=is_active_parsed,
                department_id=default_dept.id,
                dynamic_attributes=dynamic_json_payload
            )
            
            modern_db.add(new_employee)
            migrated_count += 1

        modern_db.commit()
        
        log_entry.status = "SUCCESS"
        log_entry.migrated_records = migrated_count
        log_entry.skipped_records = skipped_count
        log_entry.completed_at = datetime.now(timezone.utc)
        modern_db.commit()

    except Exception as e:
        modern_db.rollback()
        log_entry.status = "FAILED"
        log_entry.error_message = str(e)
        log_entry.completed_at = datetime.now(timezone.utc)
        modern_db.commit()

# =====================================================================
# 4. API ROUTER (Integrated directly as per plan)
# =====================================================================
router_migration = APIRouter(prefix="/migration", tags=["Legacy Data Migration"])

@router_migration.post("/start-batch", status_code=202)
def start_legacy_data_migration(
    background_tasks: BackgroundTasks,
    batch_size: int = 500,
    legacy_db: Session = Depends(get_legacy_db),
    modern_db: Session = Depends(get_modern_db)
):
    try:
        batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
        background_tasks.add_task(run_employee_migration_batch, legacy_db, modern_db, batch_size, batch_id)
        return {
            "status": "Processing", 
            "batch_id": batch_id,
            "message": f"Migration of batch size {batch_size} started in the background."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate migration: {str(e)}")

@router_migration.get("/status")
def check_migration_status(limit: int = 10, db: Session = Depends(get_modern_db)):
    logs = db.query(MigrationLog).order_by(MigrationLog.started_at.desc()).limit(limit).all()
    if not logs:
        return {"message": "No migration logs found."}
    return logs