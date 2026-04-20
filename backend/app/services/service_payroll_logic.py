# app/services/service_payroll_logic.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from app.models.modern_postgres.table_payroll import Payroll
from app.models.modern_postgres.table_employee import Employee
from app.schemas.schema_payroll import PayrollCreate
from app.services.service_tax_engine import SpecializedLaborTaxEngine

def process_and_save_payroll(db: Session, payroll_data: PayrollCreate):
    employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if not employee.is_active:
        raise HTTPException(status_code=400, detail="Cannot process payroll for inactive employee")

    duplicate_check = db.query(Payroll).filter(
        Payroll.employee_id == payroll_data.employee_id,
        Payroll.pay_period_start == payroll_data.pay_period_start,
        Payroll.pay_period_end == payroll_data.pay_period_end,
        Payroll.is_deleted == False
    ).first()

    if duplicate_check:
        raise HTTPException(status_code=400, detail="Payroll already exists for this period")

    reg_pay = payroll_data.regular_hours * payroll_data.hourly_base_rate
    ot_pay = payroll_data.overtime_hours * (payroll_data.hourly_base_rate * Decimal('1.5'))
    dt_pay = payroll_data.double_time_hours * (payroll_data.hourly_base_rate * Decimal('2.0'))
    gross_pay = round(reg_pay + ot_pay + dt_pay, 4)

    # FIXED: Safely extracting data from Python Dictionary (JSONB)
    dyn_attrs = employee.dynamic_attributes or {}
    legacy_fields = dyn_attrs.get("legacy_custom_fields", {})
    union_info = dyn_attrs.get("union_info", {})

    state_code = legacy_fields.get("state_code", "TX")
    is_union_member = union_info.get("is_union_member", False)

    federal_tax = SpecializedLaborTaxEngine.calculate_federal_tax(db, gross_pay)
    state_tax = SpecializedLaborTaxEngine.calculate_state_tax(db, gross_pay, state_code)
    union_dues = SpecializedLaborTaxEngine.calculate_union_dues(db, gross_pay, is_union_member)
    
    total_deductions = federal_tax + state_tax + union_dues + payroll_data.medical_deduction
    net_pay = round(gross_pay - total_deductions, 4)

    if net_pay < 0:
        raise HTTPException(status_code=400, detail="Calculated net pay is negative. Check deductions.")

    db_payroll = Payroll(
        employee_id=payroll_data.employee_id,
        pay_period_start=payroll_data.pay_period_start,
        pay_period_end=payroll_data.pay_period_end,
        regular_hours=payroll_data.regular_hours,
        overtime_hours=payroll_data.overtime_hours,
        double_time_hours=payroll_data.double_time_hours,
        hourly_base_rate=payroll_data.hourly_base_rate,
        union_dues=union_dues,
        medical_deduction=payroll_data.medical_deduction,
        gross_pay=gross_pay,
        federal_tax=federal_tax,
        state_tax=state_tax,
        net_pay=net_pay,
        status="PAID", # Standard status for processed records
        calculation_metadata="Calculated via Dynamic DB Tax Engine"
    )
    
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    
    return db_payroll