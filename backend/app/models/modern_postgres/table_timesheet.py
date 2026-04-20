# app/models/modern_postgres/table_timesheet.py
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class TimesheetStatus(str, enum.Enum):
    """
    Comprehensive workflow states for enterprise timesheet & payroll integration.
    """
    DRAFT = "DRAFT"             # Employee is currently filling it out
    SUBMITTED = "SUBMITTED"     # Sent to supervisor for review
    APPROVED = "APPROVED"       # Supervisor approved, ready for payroll batch
    REJECTED = "REJECTED"       # Supervisor rejected back to employee
    DISPUTED = "DISPUTED"       # HR/Employee raised an issue on hours
    PROCESSED = "PROCESSED"     # Payroll calculated and locked forever

class Timesheet(BaseModern, AuditTrailMixin):
    """
    Highly detailed labor hour tracking table.
    Crucial for specialized labor payroll, compliance, and billing.
    """
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Optional mapping to specific customer sites or projects (Enterprise Feature)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    cost_center_code = Column(String(50), nullable=True, comment="Project or Site Code for Job Costing")
    
    work_date = Column(Date, nullable=False, index=True)
    
    # Financial Grade Precision for Hours
    regular_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    overtime_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    double_time_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    # Workflow Logic
    status = Column(Enum(TimesheetStatus), default=TimesheetStatus.DRAFT, nullable=False, index=True)
    
    # Audit & Approval Chain (Who did what and when)
    supervisor_notes = Column(String(1000), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="ID of the supervisor/HR who approved")
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    employee = relationship("Employee")
    # customer = relationship("Customer") # Optional if needed later