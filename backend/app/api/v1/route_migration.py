# app/api/v1/route_migration.py
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_legacy_db, get_modern_db
from app.services.service_etl_migration import run_employee_migration_batch
from app.models.modern_postgres.table_migration_logs import MigrationLog

router = APIRouter(prefix="/migration", tags=["Legacy Data Migration"])

@router.post("/start-batch", status_code=202)
def start_legacy_data_migration(
    background_tasks: BackgroundTasks,
    batch_size: int = 500,
    legacy_db: Session = Depends(get_legacy_db),
    modern_db: Session = Depends(get_modern_db)
):
    try:
        background_tasks.add_task(run_employee_migration_batch, legacy_db, modern_db, batch_size)
        return {
            "status": "Processing", 
            "message": f"Migration of batch size {batch_size} started in the background."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate migration: {str(e)}")

@router.get("/status")
def check_migration_status(limit: int = 10, db: Session = Depends(get_modern_db)):
    logs = db.query(MigrationLog).order_by(MigrationLog.started_at.desc()).limit(limit).all()
    if not logs:
        return {"message": "No migration logs found."}
    return logs