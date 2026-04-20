# app/models/models_tracking.py
# app/models/models_tracking.py
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone

from app.core.db_setup import BaseModern
from app.models.models_core import AuditTrailMixin

class Job(BaseModern, AuditTrailMixin):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    job_name = Column(String(200), nullable=False)
    job_location = Column(String(500), nullable=True)
    
    contract_date = Column(Date, nullable=True)
    wc_expire_date = Column(Date, nullable=True)
    gl_expire_date = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)

    customer = relationship("Customer", back_populates="jobs")
    assignments = relationship("AssignmentTracking", back_populates="job", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="job", cascade="all, delete-orphan")


class AssignmentTracking(BaseModern, AuditTrailMixin):
    __tablename__ = "assignment_tracking"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    
    pay_rate = Column(Numeric(15, 4), nullable=False)
    bill_rate = Column(Numeric(15, 4), nullable=False)
    bill_rate_ot = Column(Numeric(15, 4), nullable=False)
    
    assignment_start_date = Column(Date, nullable=False)
    assignment_end_date = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)

    job = relationship("Job", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")


class TimesheetStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPUTED = "DISPUTED"
    PROCESSED = "PROCESSED"


class Timesheet(BaseModern, AuditTrailMixin):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    
    cost_center_code = Column(String(50), nullable=True)
    work_date = Column(Date, nullable=False, index=True)
    
    regular_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    overtime_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    double_time_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    status = Column(Enum(TimesheetStatus), default=TimesheetStatus.DRAFT, nullable=False, index=True)
    
    supervisor_notes = Column(String(1000), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    employee = relationship("Employee", back_populates="timesheets")
    customer = relationship("Customer")
    job = relationship("Job")
    approved_by_user = relationship("User")