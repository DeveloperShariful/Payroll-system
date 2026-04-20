# app/api/v1/route_reports.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import get_current_user, RoleChecker
from app.models.modern_postgres.table_user import User, UserRole
from app.services.service_reports import generate_department_payroll_summary

router = APIRouter(prefix="/reports", tags=["Enterprise Analytics & Reports"])

# High-level overview restricted to Management and HR
allow_management = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])

@router.get("/department-summary", dependencies=[Depends(allow_management)])
def get_department_payroll_summary(
    start_date: date = Query(..., description="Start date of the reporting period"),
    end_date: date = Query(..., description="End date of the reporting period"),
    db: Session = Depends(get_modern_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a financial summary grouped by department.
    Replaces the legacy 'Monthly Payroll Summary' MS Access report.
    """
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