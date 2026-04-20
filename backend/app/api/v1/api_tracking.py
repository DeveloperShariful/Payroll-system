# app/api/v1/api_tracking.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional

from app.core.db_setup import get_modern_db
from app.api.dependencies_core import get_current_user, RoleChecker

from app.models.models_core import User, UserRole
from app.models.models_profiles import Customer, Employee
from app.models.models_tracking import Job, AssignmentTracking, Timesheet, TimesheetStatus

from app.schemas.schemas_tracking import (
    JobCreate, JobResponse, 
    AssignmentCreate, AssignmentResponse, 
    TimesheetCreate, TimesheetApproval, TimesheetResponse
)

# ==========================================
# ROUTERS
# ==========================================
router_jobs_assignments = APIRouter(prefix="/tracking", tags=["Job & Assignment Tracking"])
router_timesheets = APIRouter(prefix="/timesheets", tags=["Timesheet Workflow"])

allow_management = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])
allow_all_users = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE])
allow_supervisors_only = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPERVISOR])

# =========================================================================
# 1. JOBS & ASSIGNMENTS ENDPOINTS
# =========================================================================
@router_jobs_assignments.post("/jobs", response_model=JobResponse, dependencies=[Depends(allow_management)])
def create_job(job_in: JobCreate, db: Session = Depends(get_modern_db)):
    customer = db.query(Customer).filter(Customer.id == job_in.customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    new_job = Job(**job_in.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router_jobs_assignments.get("/jobs/{customer_id}", response_model=List[JobResponse], dependencies=[Depends(allow_management)])
def get_jobs_by_customer(customer_id: int, db: Session = Depends(get_modern_db)):
    return db.query(Job).filter(Job.customer_id == customer_id, Job.is_deleted == False).all()

@router_jobs_assignments.post("/assignments", response_model=AssignmentResponse, dependencies=[Depends(allow_management)])
def assign_employee_to_job(assign_in: AssignmentCreate, db: Session = Depends(get_modern_db)):
    existing = db.query(AssignmentTracking).filter(
        AssignmentTracking.job_id == assign_in.job_id,
        AssignmentTracking.employee_id == assign_in.employee_id,
        AssignmentTracking.is_active == True,
        AssignmentTracking.is_deleted == False
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Employee is already actively assigned to this job.")

    new_assignment = AssignmentTracking(**assign_in.model_dump())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router_jobs_assignments.get("/assignments/{job_id}", dependencies=[Depends(allow_management)])
def get_assignments_by_job(job_id: int, db: Session = Depends(get_modern_db)):
    """Returns custom dictionary including employee details for the tracking data grid"""
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

# =========================================================================
# 2. TIMESHEETS WORKFLOW ENDPOINTS
# =========================================================================
@router_timesheets.get("/my-assignments", dependencies=[Depends(allow_all_users)])
def get_my_active_jobs(db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.email == current_user.email, Employee.is_deleted == False).first()
    if not emp:
        return []
    
    assignments = db.query(AssignmentTracking).filter(
        AssignmentTracking.employee_id == emp.id, 
        AssignmentTracking.is_active == True,
        AssignmentTracking.is_deleted == False
    ).all()
    
    return [{"job_id": a.job_id, "job_name": a.job.job_name, "customer_id": a.job.customer_id} for a in assignments]

@router_timesheets.post("/", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(allow_all_users)])
def submit_daily_timesheet(timesheet_in: TimesheetCreate, db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    actual_employee_id = timesheet_in.employee_id
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if not emp:
            raise HTTPException(status_code=400, detail="User email not linked to any Labor Profile.")
        actual_employee_id = emp.id

    # Prevent duplicate entries for (Employee + Job + Date)
    existing_entry = db.query(Timesheet).filter(
        Timesheet.employee_id == actual_employee_id,
        Timesheet.job_id == timesheet_in.job_id,
        Timesheet.work_date == timesheet_in.work_date,
        Timesheet.is_deleted == False
    ).first()
    
    if existing_entry:
        raise HTTPException(status_code=400, detail="You have already submitted a timesheet for this job on this date.")

    new_timesheet = Timesheet(
        employee_id=actual_employee_id,
        customer_id=timesheet_in.customer_id, 
        job_id=timesheet_in.job_id,
        work_date=timesheet_in.work_date,
        regular_hours=timesheet_in.regular_hours,
        overtime_hours=timesheet_in.overtime_hours,
        double_time_hours=timesheet_in.double_time_hours,
        status=TimesheetStatus.SUBMITTED
    )
    
    db.add(new_timesheet)
    db.commit()
    db.refresh(new_timesheet)
    return new_timesheet

@router_timesheets.patch("/{timesheet_id}/approve", response_model=TimesheetResponse, dependencies=[Depends(allow_supervisors_only)])
def process_timesheet_approval(timesheet_id: int, approval_data: TimesheetApproval, db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id, Timesheet.is_deleted == False).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found.")
    
    if timesheet.status == TimesheetStatus.PROCESSED:
        raise HTTPException(status_code=400, detail="Cannot edit. This record is locked and already paid via Payroll.")

    timesheet.status = approval_data.status
    timesheet.approved_by_id = current_user.id
    timesheet.approved_at = datetime.now(timezone.utc)
    
    if approval_data.supervisor_notes:
        timesheet.supervisor_notes = approval_data.supervisor_notes
        
    db.commit()
    db.refresh(timesheet)
    return timesheet

@router_timesheets.get("/", response_model=List[TimesheetResponse], dependencies=[Depends(allow_all_users)])
def get_all_timesheets(
    limit: int = Query(100, ge=1, le=1000, description="Pagination to handle massive timesheet data"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Timesheet).filter(Timesheet.is_deleted == False)
    
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if emp:
            query = query.filter(Timesheet.employee_id == emp.id)
        else:
            return []
            
    return query.order_by(Timesheet.work_date.desc()).offset(offset).limit(limit).all()