# app/api/v1/route_payroll.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import RoleChecker, get_current_user
from app.models.modern_postgres.table_user import User, UserRole
from app.models.modern_postgres.table_payroll import Payroll
from app.models.modern_postgres.table_timesheet import Timesheet, TimesheetStatus
from app.models.modern_postgres.table_employee import Employee
from app.schemas.schema_payroll import PayrollCreate, PayrollResponse
from app.services.service_payroll_logic import process_and_save_payroll

router = APIRouter(prefix="/payrolls", tags=["Payroll Processor"])

allow_hr_admin = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])
allow_all_viewers = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE])

@router.get("/ready", dependencies=[Depends(allow_hr_admin)])
def get_approved_timesheets_for_payroll(db: Session = Depends(get_modern_db)):
    """
    Fetch all employees who have APPROVED timesheets ready to be processed into Payroll.
    This creates the "Master-Detail" batch processing experience for HR.
    """
    # Group approved timesheets by employee
    ready_data = db.query(
        Timesheet.employee_id,
        func.sum(Timesheet.regular_hours).label("total_reg"),
        func.sum(Timesheet.overtime_hours).label("total_ot"),
        func.sum(Timesheet.double_time_hours).label("total_dt"),
        func.min(Timesheet.work_date).label("period_start"),
        func.max(Timesheet.work_date).label("period_end")
    ).filter(
        Timesheet.status == TimesheetStatus.APPROVED
    ).group_by(Timesheet.employee_id).all()

    result = []
    for row in ready_data:
        emp = db.query(Employee).filter(Employee.id == row.employee_id).first()
        if emp:
            result.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department_id": emp.department_id,
                "period_start": row.period_start,
                "period_end": row.period_end,
                "total_regular_hours": float(row.total_reg or 0),
                "total_overtime_hours": float(row.total_ot or 0),
                "total_double_time_hours": float(row.total_dt or 0),
                "suggested_base_rate": 25.00 # In real app, this comes from Job Role table
            })
            
    return result

@router.post("/process", response_model=PayrollResponse, status_code=201, dependencies=[Depends(allow_hr_admin)])
def process_payroll_timesheet(payroll_in: PayrollCreate, db: Session = Depends(get_modern_db)):
    """
    ENTERPRISE PAYROLL ENDPOINT:
    Calculates Gross/Taxes/Net. Service layer validates business rules and saves to DB.
    Also marks the associated timesheets as 'PROCESSED' so they don't show up again.
    """
    processed_payroll = process_and_save_payroll(db=db, payroll_data=payroll_in)
    
    # FIXED: Properly updating Enum status and disabling synchronization to prevent SQLAlchemy crash
    db.query(Timesheet).filter(
        Timesheet.employee_id == payroll_in.employee_id,
        Timesheet.status == TimesheetStatus.APPROVED,
        Timesheet.work_date >= payroll_in.pay_period_start,
        Timesheet.work_date <= payroll_in.pay_period_end
    ).update({"status": TimesheetStatus.PROCESSED}, synchronize_session=False)
    
    db.commit()

    return processed_payroll

@router.get("/history", dependencies=[Depends(allow_all_viewers)])
def get_payroll_history(db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    """
    Fetch historical payrolls (Pay Stubs).
    HR/Admin sees all. Employees see only theirs.
    """
    query = db.query(Payroll).filter(Payroll.status == "PAID", Payroll.is_deleted == False)

    # Restrict data if the user is an Employee
    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if not emp:
            return []
        query = query.filter(Payroll.employee_id == emp.id)

    # Order by most recent pay period
    payrolls = query.order_by(Payroll.pay_period_end.desc()).all()

    result = []
    for p in payrolls:
        # Fetch employee name for HR/Admin views
        emp_name = "Unknown"
        if current_user.role != UserRole.EMPLOYEE:
             emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
             if emp: emp_name = f"{emp.first_name} {emp.last_name}"

        result.append({
            "id": p.id,
            "employee_id": p.employee_id,
            "employee_name": emp_name,
            "period": f"{p.pay_period_start} to {p.pay_period_end}",
            "gross_pay": float(p.gross_pay),
            "taxes": float(p.federal_tax + p.state_tax + p.union_dues + p.medical_deduction),
            "net_pay": float(p.net_pay),
            "status": p.status,
            "processed_at": p.created_at
        })
        
    return result