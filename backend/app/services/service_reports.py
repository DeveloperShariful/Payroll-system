# app/services/service_reports.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.modern_postgres.table_payroll import Payroll
from app.models.modern_postgres.table_department import Department
from app.models.modern_postgres.table_employee import Employee

def generate_department_payroll_summary(db: Session, start_date: str, end_date: str):
    """
    Translates complex MS Access aggregate queries into SQLAlchemy.
    Calculates total gross pay, net pay, and taxes per department for a given period.
    """
    summary = db.query(
        Department.name.label("department_name"),
        func.count(func.distinct(Employee.id)).label("total_employees"),
        func.sum(Payroll.regular_hours).label("total_regular_hours"),
        func.sum(Payroll.overtime_hours).label("total_overtime_hours"),
        func.sum(Payroll.gross_pay).label("total_gross_pay"),
        func.sum(Payroll.net_pay).label("total_net_pay"),
        func.sum(Payroll.federal_tax + Payroll.state_tax).label("total_taxes_withheld")
    ).join(
        Employee, Department.id == Employee.department_id
    ).join(
        Payroll, Employee.id == Payroll.employee_id
    ).filter(
        Payroll.pay_period_start >= start_date,
        Payroll.pay_period_end <= end_date,
        Payroll.status == "PAID",
        Payroll.is_deleted == False
    ).group_by(
        Department.name
    ).all()
    
    # Format the result set into a list of dictionaries for JSON serialization
    return [
        {
            "department": row.department_name,
            "employee_count": row.total_employees,
            "hours_breakdown": {
                "regular": float(row.total_regular_hours or 0),
                "overtime": float(row.total_overtime_hours or 0)
            },
            "financials": {
                "gross_pay": float(row.total_gross_pay or 0),
                "net_pay": float(row.total_net_pay or 0),
                "taxes_withheld": float(row.total_taxes_withheld or 0)
            }
        }
        for row in summary
    ]