# app/models/modern_postgres/table_payroll.py
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Payroll(BaseModern, AuditTrailMixin):
    """
    Enterprise Payroll Model.
    Strictly uses Numeric (Decimal) for all financial fields to prevent floating-point errors.
    Supports specialized labor rules (Regular, Overtime, Double Time, Union Dues).
    """
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False)
    
    # Payroll Cycle Metadata
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    status = Column(String(50), default="DRAFT", index=True, nullable=False) 

    # Specialized Labor Hours Tracking (Precision: 2 decimal places)
    regular_hours = Column(Numeric(10, 2), default=0.00, nullable=False)
    overtime_hours = Column(Numeric(10, 2), default=0.00, nullable=False)
    double_time_hours = Column(Numeric(10, 2), default=0.00, nullable=False) 

    # Financials (Precision: 15 digits total, 4 decimal places for exact accounting)
    hourly_base_rate = Column(Numeric(15, 4), nullable=False)
    gross_pay = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    # Deductions & Taxes
    federal_tax = Column(Numeric(15, 4), default=0.00, nullable=False)
    state_tax = Column(Numeric(15, 4), default=0.00, nullable=False)
    union_dues = Column(Numeric(15, 4), default=0.00, nullable=False) 
    medical_deduction = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    # Final Result
    net_pay = Column(Numeric(15, 4), default=0.00, nullable=False)

    # Any dynamic calculation logic/notes that don't fit fixed columns
    calculation_metadata = Column(String(1000), nullable=True)

    employee = relationship("Employee", back_populates="payrolls")