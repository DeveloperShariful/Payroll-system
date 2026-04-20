# app/services/service_invoice_logic.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
from app.models.modern_postgres.table_invoice import Invoice
from app.models.modern_postgres.table_timesheet import Timesheet, TimesheetStatus
from app.models.modern_postgres.table_assignment import AssignmentTracking

def generate_job_invoice(db: Session, job_id: int, start_date: date, end_date: date):
    """
    Core Logic: Fetches approved labor hours for a job, multiplies by Bill Rates, 
    and generates a weekly customer invoice.
    """
    # 1. Get all assigned employees for this job to find their bill rates
    assignments = db.query(AssignmentTracking).filter(AssignmentTracking.job_id == job_id).all()
    if not assignments:
        return None

    total_hours = Decimal("0.00")
    subtotal = Decimal("0.00")
    customer_id = None

    for assign in assignments:
        customer_id = assign.job.customer_id
        # Get approved timesheets for this employee on this job
        timesheets = db.query(Timesheet).filter(
            Timesheet.employee_id == assign.employee_id,
            Timesheet.status == TimesheetStatus.APPROVED,
            Timesheet.work_date >= start_date,
            Timesheet.work_date <= end_date
        ).all()

        for ts in timesheets:
            total_hours += (ts.regular_hours + ts.overtime_hours + ts.double_time_hours)
            
            # Billing Calculation: (Reg * BillRate) + (OT * BillRateOT)
            reg_bill = ts.regular_hours * assign.bill_rate
            ot_bill = ts.overtime_hours * assign.bill_rate_ot
            dt_bill = ts.double_time_hours * (assign.bill_rate_ot * Decimal("1.2")) # Double time is 20% more than OT bill
            
            subtotal += (reg_bill + ot_bill + dt_bill)
            
            # Mark timesheet as processed for invoicing
            ts.status = TimesheetStatus.PROCESSED

    if subtotal == 0:
        return None

    # 2. Create the Invoice Record
    new_invoice = Invoice(
        customer_id=customer_id,
        job_id=job_id,
        invoice_number=f"INV-{date.today().strftime('%Y%m')}-{job_id}-{int(subtotal)}",
        billing_period_start=start_date,
        billing_period_end=end_date,
        total_hours=total_hours,
        subtotal_amount=subtotal,
        tax_amount=Decimal("0.00"), # Staffing often has 0 tax, or add rule here
        total_amount=subtotal,
        status="UNPAID"
    )

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice