# app/services/service_finance_engine.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from decimal import Decimal
from datetime import date

from app.models.models_core import Department
from app.models.models_profiles import Employee
from app.models.models_tracking import Timesheet, TimesheetStatus, AssignmentTracking
from app.models.models_finance import Payroll, PayrollRule, Invoice
from app.schemas.schemas_finance import PayrollCreate

# =====================================================================
# 1. TAX & COMPLIANCE ENGINE (Centralized Math Logic)
# =====================================================================
class SpecializedLaborTaxEngine:
    @staticmethod
    def get_rule_rate(db: Session, rule_type: str, state_code: str = None) -> Decimal:
        query = db.query(PayrollRule).filter(PayrollRule.rule_type == rule_type, PayrollRule.is_active == True)
        if state_code:
            query = query.filter(PayrollRule.state_code == state_code)
        
        rule = query.first()
        return rule.percentage_rate if rule else Decimal('0.0000')

    @staticmethod
    def calculate_federal_tax(db: Session, gross_pay: Decimal, dependents: int = 0) -> Decimal:
        taxable_amount = max(Decimal('0.00'), gross_pay - (Decimal('50.00') * dependents))
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "FEDERAL_TAX")
        return round(taxable_amount * rate, 4)

    @staticmethod
    def calculate_union_dues(db: Session, gross_pay: Decimal, is_union_member: bool) -> Decimal:
        if not is_union_member:
            return Decimal('0.00')
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "UNION_DUES")
        return round(gross_pay * rate, 4)
        
    @staticmethod
    def calculate_state_tax(db: Session, gross_pay: Decimal, state_code: str) -> Decimal:
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "STATE_TAX", state_code)
        return round(gross_pay * rate, 4)


# =====================================================================
# 2. PAYROLL PROCESSOR
# =====================================================================
def process_and_save_payroll(db: Session, payroll_data: PayrollCreate) -> Payroll:
    employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id, Employee.is_deleted == False).first()
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

    # Financial Precision calculation
    reg_pay = payroll_data.regular_hours * payroll_data.hourly_base_rate
    ot_pay = payroll_data.overtime_hours * (payroll_data.hourly_base_rate * Decimal('1.5'))
    dt_pay = payroll_data.double_time_hours * (payroll_data.hourly_base_rate * Decimal('2.0'))
    gross_pay = round(reg_pay + ot_pay + dt_pay, 4)

    # Legacy MS Access specific logic extracted from JSONB
    dyn_attrs = employee.dynamic_attributes or {}
    legacy_fields = dyn_attrs.get("legacy_custom_fields", {})
    union_info = dyn_attrs.get("union_info", {})

    state_code = legacy_fields.get("state_code", "TX")
    is_union_member = union_info.get("is_union_member", False)

    # Execute Tax Engine
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
        status="PAID", 
        calculation_metadata="Calculated via Dynamic Finance Engine"
    )
    
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    
    return db_payroll


# =====================================================================
# 3. INVOICE GENERATOR
# =====================================================================
def generate_job_invoice(db: Session, job_id: int, start_date: date, end_date: date) -> Invoice | None:
    assignments = db.query(AssignmentTracking).filter(AssignmentTracking.job_id == job_id, AssignmentTracking.is_deleted == False).all()
    if not assignments:
        return None

    total_hours = Decimal("0.00")
    subtotal = Decimal("0.00")
    customer_id = None

    for assign in assignments:
        customer_id = assign.job.customer_id
        
        timesheets = db.query(Timesheet).filter(
            Timesheet.employee_id == assign.employee_id,
            Timesheet.job_id == job_id,
            Timesheet.status == TimesheetStatus.APPROVED,
            Timesheet.work_date >= start_date,
            Timesheet.work_date <= end_date,
            Timesheet.is_deleted == False
        ).all()

        for ts in timesheets:
            total_hours += (ts.regular_hours + ts.overtime_hours + ts.double_time_hours)
            
            # Client Requirement: Use specific bill rates from tracking assignment
            reg_bill = ts.regular_hours * assign.bill_rate
            ot_bill = ts.overtime_hours * assign.bill_rate_ot
            dt_bill = ts.double_time_hours * (assign.bill_rate_ot * Decimal("1.2")) 
            
            subtotal += (reg_bill + ot_bill + dt_bill)
            ts.status = TimesheetStatus.PROCESSED

    if subtotal == Decimal("0.00"):
        return None

    new_invoice = Invoice(
        customer_id=customer_id,
        job_id=job_id,
        invoice_number=f"INV-{date.today().strftime('%Y%m')}-{job_id}-{int(subtotal)}",
        billing_period_start=start_date,
        billing_period_end=end_date,
        total_hours=total_hours,
        subtotal_amount=subtotal,
        tax_amount=Decimal("0.00"), 
        total_amount=subtotal,
        status="UNPAID"
    )

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice


# =====================================================================
# 4. FINANCIAL REPORTS GENERATOR
# =====================================================================
def generate_department_payroll_summary(db: Session, start_date: date, end_date: date) -> list:
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