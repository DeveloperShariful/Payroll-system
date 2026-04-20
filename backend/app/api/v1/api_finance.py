# app/api/v1/api_finance.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date

from app.core.db_setup import get_modern_db
from app.api.dependencies_core import get_current_user, RoleChecker

from app.models.models_core import User, UserRole
from app.models.models_profiles import Employee
from app.models.models_tracking import Timesheet, TimesheetStatus
from app.models.models_finance import Payroll, Invoice

from app.schemas.schemas_finance import PayrollCreate, PayrollResponse, InvoiceRequest, InvoiceResponse

# Note: These service imports will align with your upcoming 'service_finance_engine.py'
from app.services.service_finance_engine import (
    process_and_save_payroll, 
    generate_job_invoice, 
    generate_department_payroll_summary
)

# ==========================================
# ROUTERS
# ==========================================
router_payrolls = APIRouter(prefix="/payrolls", tags=["Payroll Processor"])
router_invoices = APIRouter(prefix="/invoices", tags=["Customer Invoicing System"])
router_reports = APIRouter(prefix="/reports", tags=["Enterprise Analytics & Reports"])

allow_hr_admin = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])
allow_all_viewers = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE])

# =========================================================================
# 1. PAYROLL ENDPOINTS
# =========================================================================
@router_payrolls.get("/ready", dependencies=[Depends(allow_hr_admin)])
def get_approved_timesheets_for_payroll(db: Session = Depends(get_modern_db)):
    ready_data = db.query(
        Timesheet.employee_id,
        func.sum(Timesheet.regular_hours).label("total_reg"),
        func.sum(Timesheet.overtime_hours).label("total_ot"),
        func.sum(Timesheet.double_time_hours).label("total_dt"),
        func.min(Timesheet.work_date).label("period_start"),
        func.max(Timesheet.work_date).label("period_end")
    ).filter(
        Timesheet.status == TimesheetStatus.APPROVED,
        Timesheet.is_deleted == False
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
                "suggested_base_rate": 25.00 
            })
            
    return result

@router_payrolls.post("/process", response_model=PayrollResponse, status_code=201, dependencies=[Depends(allow_hr_admin)])
def process_payroll_timesheet(payroll_in: PayrollCreate, db: Session = Depends(get_modern_db)):
    # Calls the central finance engine to calculate taxes and net pay
    processed_payroll = process_and_save_payroll(db=db, payroll_data=payroll_in)
    
    db.query(Timesheet).filter(
        Timesheet.employee_id == payroll_in.employee_id,
        Timesheet.status == TimesheetStatus.APPROVED,
        Timesheet.work_date >= payroll_in.pay_period_start,
        Timesheet.work_date <= payroll_in.pay_period_end
    ).update({"status": TimesheetStatus.PROCESSED}, synchronize_session=False)
    
    db.commit()
    return processed_payroll

@router_payrolls.get("/history", dependencies=[Depends(allow_all_viewers)])
def get_payroll_history(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payroll).filter(Payroll.status == "PAID", Payroll.is_deleted == False)

    if current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.email == current_user.email).first()
        if not emp:
            return []
        query = query.filter(Payroll.employee_id == emp.id)

    payrolls = query.order_by(Payroll.pay_period_end.desc()).offset(offset).limit(limit).all()

    result = []
    for p in payrolls:
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

# =========================================================================
# 2. INVOICE ENDPOINTS
# =========================================================================
@router_invoices.post("/generate", dependencies=[Depends(allow_hr_admin)])
def create_customer_invoice(req: InvoiceRequest, db: Session = Depends(get_modern_db)):
    invoice = generate_job_invoice(db, req.job_id, req.start_date, req.end_date)
    if not invoice:
        raise HTTPException(status_code=400, detail="No approved hours found for this period to invoice.")
    return invoice

@router_invoices.get("/history", dependencies=[Depends(allow_hr_admin)])
def get_invoice_history(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db)
):
    return db.query(Invoice).filter(Invoice.is_deleted == False).order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

@router_invoices.patch("/{invoice_id}/pay", dependencies=[Depends(allow_hr_admin)])
def mark_invoice_as_paid(invoice_id: int, db: Session = Depends(get_modern_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.is_deleted == False).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = "PAID"
    db.commit()
    return {"message": "Invoice marked as paid"}

# =========================================================================
# 3. REPORTS ENDPOINTS
# =========================================================================
@router_reports.get("/department-summary", dependencies=[Depends(allow_hr_admin)])
def get_department_payroll_summary_report(
    start_date: date = Query(..., description="Start date of the reporting period"),
    end_date: date = Query(..., description="End date of the reporting period"),
    db: Session = Depends(get_modern_db),
    current_user: User = Depends(get_current_user)
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
        
    report_data = generate_department_payroll_summary(db=db, start_date=start_date, end_date=end_date)
    
    return {
        "report_metadata": {
            "generated_by": current_user.email,
            "period": f"{start_date} to {end_date}",
            "record_count": len(report_data)
        },
        "data": report_data
    }