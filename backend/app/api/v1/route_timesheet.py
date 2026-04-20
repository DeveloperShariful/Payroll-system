# app/api/v1/route_timesheet.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import get_current_user, RoleChecker
from app.models.modern_postgres.table_user import User, UserRole
from app.models.modern_postgres.table_timesheet import Timesheet, TimesheetStatus
from app.models.modern_postgres.table_employee import Employee
from app.models.modern_postgres.table_assignment import AssignmentTracking
from app.schemas.schema_timesheet import TimesheetCreate, TimesheetResponse, TimesheetApproval

router = APIRouter(prefix="/timesheets", tags=["Timesheet Workflow"])

allow_all_users = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE])
allow_supervisors_only = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPERVISOR])

# =========================================================================
# 1. GET ACTIVE ASSIGNMENTS (For Employee Dropdown)
# =========================================================================
@router.get("/my-assignments", dependencies=[Depends(get_current_user)])
def get_my_active_jobs(db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    """
    Returns all Jobs/Sites the logged-in employee is currently assigned to.
    Required for the 'Select Job' dropdown in the Timesheet Submit UI.
    """
    # Find the Employee record linked to this User email
    emp = db.query(Employee).filter(Employee.email == current_user.email).first()
    if not emp:
        return []
    
    # Fetch active assignments from the Tracking table
    assignments = db.query(AssignmentTracking).filter(
        AssignmentTracking.employee_id == emp.id, 
        AssignmentTracking.is_active == True
    ).all()
    
    return [{"job_id": a.job_id, "job_name": a.job.job_name} for a in assignments]

# =========================================================================
# 2. SUBMIT TIMESHEET (With Job Context)
# =========================================================================
@router.post("/", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(allow_all_users)])
def submit_daily_timesheet(timesheet_in: TimesheetCreate, db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    """
    Submits a daily timesheet for a specific job.
    Logic: Ensures the employee is assigned to the job and prevents double submission for the same day.
    """
    # 1. Resolve actual Employee ID
    actual_employee_id = timesheet_in.employee_id
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if not emp:
            raise HTTPException(status_code=400, detail="User email not linked to any Labor Profile.")
        actual_employee_id = emp.id

    # 2. Prevent duplicate entries for (Employee + Job + Date)
    existing_entry = db.query(Timesheet).filter(
        Timesheet.employee_id == actual_employee_id,
        Timesheet.customer_id == timesheet_in.customer_id, # This holds the Job ID context
        Timesheet.work_date == timesheet_in.work_date
    ).first()
    
    if existing_entry:
        raise HTTPException(status_code=400, detail="You have already submitted a timesheet for this job on this date.")

    # 3. Create Record
    new_timesheet = Timesheet(
        employee_id=actual_employee_id,
        customer_id=timesheet_in.customer_id, # Linking to the Job/Project ID
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

# =========================================================================
# 3. APPROVE/REJECT TIMESHEET (Supervisor Logic)
# =========================================================================
@router.patch("/{timesheet_id}/approve", response_model=TimesheetResponse, dependencies=[Depends(allow_supervisors_only)])
def process_timesheet_approval(timesheet_id: int, approval_data: TimesheetApproval, db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    """
    Updates the status of a timesheet. Locks the record if it was already processed by HR.
    """
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
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

# =========================================================================
# 4. GET ALL TIMESHEETS (Role-Based Filter)
# =========================================================================
@router.get("/", response_model=List[TimesheetResponse], dependencies=[Depends(allow_all_users)])
def get_all_timesheets(db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    """
    Lists all timesheets. 
    Employees only see theirs. HR/Admin/Supervisor see all for management.
    """
    query = db.query(Timesheet).order_by(Timesheet.work_date.desc())
    
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if emp:
            query = query.filter(Timesheet.employee_id == emp.id)
        else:
            return []
            
    return query.all()