# app/models/modern_postgres/table_invoice.py
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Invoice(BaseModern, AuditTrailMixin):
    """
    Weekly Invoice generated for Customers based on assigned Labor Hours.
    Calculates: (Total Hours * Job Bill Rate).
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    
    invoice_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. INV-2026-001
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    
    total_hours = Column(Numeric(12, 2), default=0.00, nullable=False)
    
    # Financial Totals
    subtotal_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    tax_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    total_amount = Column(Numeric(15, 4), default=0.00, nullable=False)
    
    status = Column(String(50), default="UNPAID", index=True, nullable=False) # UNPAID, PAID, OVERDUE, VOID
    is_sent_to_customer = Column(Boolean, default=False)

    # Relationships
    customer = relationship("Customer")
    job = relationship("Job")