# app/api/v1/route_tracking.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from pydantic import BaseModel, Field
from decimal import Decimal

from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import RoleChecker
from app.models.modern_postgres.table_user import UserRole
from app.models.modern_postgres.table_customer import Customer
from app.models.modern_postgres.table_job import Job
from app.models.modern_postgres.table_assignment import AssignmentTracking
from app.models.modern_postgres.table_employee import Employee

router = APIRouter(prefix="/tracking", tags=["Job & Assignment Tracking"])

allow_management = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])

# --- SCHEMAS ---
class JobCreate(BaseModel):
    customer_id: int
    job_name: str
    job_location: str | None = None
    contract_date: date | None = None
    wc_expire_date: date | None = None
    gl_expire_date: date | None = None

class AssignmentCreate(BaseModel):
    job_id: int
    employee_id: int
    pay_rate: Decimal
    bill_rate: Decimal
    bill_rate_ot: Decimal
    assignment_start_date: date

# --- ENDPOINTS: JOBS ---
@router.post("/jobs", dependencies=[Depends(allow_management)])
def create_job(job_in: JobCreate, db: Session = Depends(get_modern_db)):
    customer = db.query(Customer).filter(Customer.id == job_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    new_job = Job(**job_in.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/jobs/{customer_id}", dependencies=[Depends(allow_management)])
def get_jobs_by_customer(customer_id: int, db: Session = Depends(get_modern_db)):
    return db.query(Job).filter(Job.customer_id == customer_id, Job.is_deleted == False).all()

# --- ENDPOINTS: ASSIGNMENTS (TRACKING) ---
@router.post("/assignments", dependencies=[Depends(allow_management)])
def assign_employee_to_job(assign_in: AssignmentCreate, db: Session = Depends(get_modern_db)):
    # Check if employee is already active on this job
    existing = db.query(AssignmentTracking).filter(
        AssignmentTracking.job_id == assign_in.job_id,
        AssignmentTracking.employee_id == assign_in.employee_id,
        AssignmentTracking.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Employee is already actively assigned to this job.")

    new_assignment = AssignmentTracking(**assign_in.model_dump())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.get("/assignments/{job_id}", dependencies=[Depends(allow_management)])
def get_assignments_by_job(job_id: int, db: Session = Depends(get_modern_db)):
    assignments = db.query(AssignmentTracking).filter(
        AssignmentTracking.job_id == job_id, 
        AssignmentTracking.is_deleted == False
    ).all()
    
    result = []
    for a in assignments:
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        if emp:
            result.append({
                "assignment_id": a.id,
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "ssn_last_four": emp.ssn_last_four,
                "pay_rate": float(a.pay_rate),
                "bill_rate": float(a.bill_rate),
                "bill_rate_ot": float(a.bill_rate_ot),
                "start_date": a.assignment_start_date,
                "is_active": a.is_active
            })
    return result