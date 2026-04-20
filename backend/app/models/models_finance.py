# app/models/models_finance.py
from sqlalchemy import Column, Integer, String, Date, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db_setup import BaseModern
from app.models.models_core import AuditTrailMixin

class PayrollRule(BaseModern, AuditTrailMixin):
    __tablename__ = "payroll_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), unique=True, index=True, nullable=False)
    rule_type = Column(String(50), nullable=False)
    state_code = Column(String(5), nullable=True, index=True)
    
    percentage_rate = Column(Numeric(5, 4), default=0.0000, nullable=False)
    fixed_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)


class Payroll(BaseModern, AuditTrailMixin):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    status = Column(String(50), default="DRAFT", index=True, nullable=False) 

    regular_hours = Column(Numeric(10, 2), default=0.00, nullable=False)
    overtime_hours = Column(Numeric(10, 2), default=0.00, nullable=False)
    double_time_hours = Column(Numeric(10, 2), default=0.00, nullable=False) 

    hourly_base_rate = Column(Numeric(15, 4), nullable=False)
    gross_pay = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    federal_tax = Column(Numeric(15, 4), default=0.00, nullable=False)
    state_tax = Column(Numeric(15, 4), default=0.00, nullable=False)
    union_dues = Column(Numeric(15, 4), default=0.00, nullable=False) 
    medical_deduction = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    net_pay = Column(Numeric(15, 4), default=0.00, nullable=False)

    calculation_metadata = Column(String(1000), nullable=True)

    employee = relationship("Employee", back_populates="payrolls")


class Invoice(BaseModern, AuditTrailMixin):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    
    total_hours = Column(Numeric(12, 2), default=0.00, nullable=False)
    
    subtotal_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    tax_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    total_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    status = Column(String(50), default="UNPAID", index=True, nullable=False) 
    is_sent_to_customer = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="invoices")
    job = relationship("Job", back_populates="invoices")