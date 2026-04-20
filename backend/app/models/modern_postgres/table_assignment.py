# app/models/modern_postgres/table_assignment.py
from sqlalchemy import Column, Integer, Numeric, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class AssignmentTracking(BaseModern, AuditTrailMixin):
    """
    The CORE Intersection Table (Tracking).
    Links an Employee to a specific Job with specific financial rates.
    """
    __tablename__ = "assignment_tracking"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Financial Rates for this specific assignment
    pay_rate = Column(Numeric(15, 4), nullable=False, comment="Amount paid to the employee per hour")
    bill_rate = Column(Numeric(15, 4), nullable=False, comment="Amount billed to the customer per hour")
    bill_rate_ot = Column(Numeric(15, 4), nullable=False, comment="Overtime bill rate")
    
    assignment_start_date = Column(Date, nullable=False)
    assignment_end_date = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")