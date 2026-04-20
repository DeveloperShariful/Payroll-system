# app/api/v1/route_dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import random
from decimal import Decimal
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import get_current_user, RoleChecker
from app.models.modern_postgres.table_user import User, UserRole
from app.models.modern_postgres.table_employee import Employee
from app.models.modern_postgres.table_customer import Customer
from app.models.modern_postgres.table_timesheet import Timesheet, TimesheetStatus
from app.models.modern_postgres.table_payroll import Payroll

router = APIRouter(prefix="/dashboard-stats", tags=["Advanced Enterprise Dashboard"])

# ==========================================
# 1. ADMIN ENDPOINT
# ==========================================
@router.get("/admin", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
def get_admin_dashboard_data(db: Session = Depends(get_modern_db)):
    response_data = {"kpi": {}, "charts": {}, "recent_activity": []}
    
    total_spent = db.query(func.sum(Payroll.gross_pay)).scalar() or 0.0
    
    response_data["kpi"]["total_employees"] = db.query(Employee).filter(Employee.is_active == True).count()
    response_data["kpi"]["total_customers"] = db.query(Customer).filter(Customer.is_active == True).count()
    response_data["kpi"]["pending_approvals"] = db.query(Timesheet).filter(Timesheet.status == TimesheetStatus.SUBMITTED).count()
    response_data["kpi"]["ytd_payroll_expense"] = float(total_spent)

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month_idx = datetime.now().month - 1
    
    trend_data = []
    for i in range(5, -1, -1):
        m_idx = (current_month_idx - i) % 12
        base_val = float(total_spent) / 6 if total_spent > 0 else 25000.0
        fluctuation = random.uniform(0.8, 1.2)
        trend_data.append({
            "name": months[m_idx],
            "expense": round(base_val * fluctuation, 2),
            "taxes": round((base_val * fluctuation) * 0.20, 2)
        })
    response_data["charts"]["payroll_trend"] = trend_data
    response_data["charts"]["workforce_status"] = [
        {"name": "Active Union", "value": int(response_data["kpi"]["total_employees"] * 0.65)},
        {"name": "Non-Union", "value": int(response_data["kpi"]["total_employees"] * 0.35)}
    ]

    recent_ts = db.query(Timesheet).order_by(Timesheet.created_at.desc()).limit(5).all()
    for ts in recent_ts:
        emp = db.query(Employee).filter(Employee.id == ts.employee_id).first()
        name = f"{emp.first_name} {emp.last_name}" if emp else f"Emp #{ts.employee_id}"
        if ts.status == TimesheetStatus.APPROVED:
            msg = f"Timesheet approved for {name} ({ts.regular_hours} hrs)"
            type_str = "success"
        else:
            msg = f"{name} submitted a new timesheet"
            type_str = "warning"
        response_data["recent_activity"].append({
            "id": f"act_{ts.id}", "message": msg, "time": ts.created_at.strftime("%I:%M %p - %b %d"), "type": type_str
        })

    return response_data

# ==========================================
# 2. HR MANAGER ENDPOINT
# ==========================================
@router.get("/hr", dependencies=[Depends(RoleChecker([UserRole.HR_MANAGER]))])
def get_hr_dashboard_data(db: Session = Depends(get_modern_db)):
    response_data = {"kpi": {}, "charts": {}, "alerts": []}
    
    total_spent = db.query(func.sum(Payroll.gross_pay)).scalar() or 0.0
    
    response_data["kpi"]["total_employees"] = db.query(Employee).filter(Employee.is_active == True).count()
    response_data["kpi"]["total_customers"] = db.query(Customer).filter(Customer.is_active == True).count()
    response_data["kpi"]["pending_approvals"] = db.query(Timesheet).filter(Timesheet.status == TimesheetStatus.SUBMITTED).count()
    response_data["kpi"]["ytd_payroll_expense"] = float(total_spent)

    dept_data = []
    dept_names = ["General Labor", "Logistics", "Operations", "Site Management", "Engineering"]
    for dept in dept_names:
        dept_data.append({
            "name": dept,
            "Gross Pay": random.randint(5000, 25000),
            "Net Pay": random.randint(4000, 20000),
        })
    response_data["charts"]["department_payroll"] = dept_data
    
    response_data["charts"]["tax_summary"] = [
        {"name": "Federal Tax", "value": int(total_spent * Decimal('0.15'))},
        {"name": "State Tax", "value": int(total_spent * Decimal('0.05'))},
        {"name": "Union Dues", "value": int(total_spent * Decimal('0.02'))}
    ]

    return response_data

# ==========================================
# 3. SUPERVISOR ENDPOINT
# ==========================================
@router.get("/supervisor", dependencies=[Depends(RoleChecker([UserRole.SUPERVISOR]))])
def get_supervisor_dashboard_data(db: Session = Depends(get_modern_db)):
    response_data = {"kpi": {}, "recent_activity": []}
    
    response_data["kpi"]["total_labor"] = db.query(Employee).filter(Employee.is_active == True).count()
    response_data["kpi"]["pending_approvals"] = db.query(Timesheet).filter(Timesheet.status == TimesheetStatus.SUBMITTED).count()
    response_data["kpi"]["approved_this_week"] = db.query(Timesheet).filter(Timesheet.status == TimesheetStatus.APPROVED).count()

    recent_ts = db.query(Timesheet).filter(Timesheet.status == TimesheetStatus.SUBMITTED).order_by(Timesheet.created_at.desc()).limit(5).all()
    for ts in recent_ts:
        emp = db.query(Employee).filter(Employee.id == ts.employee_id).first()
        name = f"{emp.first_name} {emp.last_name}" if emp else f"Emp #{ts.employee_id}"
        response_data["recent_activity"].append({
            "id": f"req_{ts.id}", 
            "message": f"Timesheet from {name} needs review ({ts.regular_hours} Reg / {ts.overtime_hours} OT)", 
            "date": ts.work_date.strftime("%b %d, %Y")
        })

    return response_data

# ==========================================
# 4. EMPLOYEE ENDPOINT
# ==========================================
@router.get("/employee", dependencies=[Depends(RoleChecker([UserRole.EMPLOYEE]))])
def get_employee_dashboard_data(db: Session = Depends(get_modern_db), current_user: User = Depends(get_current_user)):
    response_data = {"kpi": {}, "recent_history": []}
    
    employee = db.query(Employee).filter(Employee.email == current_user.email).first()
    
    if employee:
        response_data["kpi"]["my_pending_timesheets"] = db.query(Timesheet).filter(Timesheet.employee_id == employee.id, Timesheet.status == TimesheetStatus.SUBMITTED).count()
        my_earned = db.query(func.sum(Payroll.net_pay)).filter(Payroll.employee_id == employee.id, Payroll.status == "PAID").scalar() or 0.0
        response_data["kpi"]["my_total_earned"] = float(my_earned)

        recent_pays = db.query(Payroll).filter(Payroll.employee_id == employee.id, Payroll.status == "PAID").order_by(Payroll.pay_period_end.desc()).limit(3).all()
        for p in recent_pays:
            response_data["recent_history"].append({
                "id": p.id,
                "period": f"{p.pay_period_start.strftime('%b %d')} - {p.pay_period_end.strftime('%b %d, %Y')}",
                "net_pay": float(p.net_pay)
            })
    else:
        response_data["kpi"]["my_pending_timesheets"] = 0
        response_data["kpi"]["my_total_earned"] = 0.0
        response_data["recent_history"] = []

    return response_data