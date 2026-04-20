# app/models/modern_postgres/table_job.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Job(BaseModern, AuditTrailMixin):
    """
    Represents a specific Project or Site under a Customer.
    Employees are assigned to Jobs, not directly to Customers.
    """
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    job_name = Column(String(200), nullable=False)
    job_location = Column(String(500), nullable=True)
    
    # Compliance & Contracts (From MS Access Image 2)
    contract_date = Column(Date, nullable=True)
    wc_expire_date = Column(Date, nullable=True, comment="Workers Comp Expiration")
    gl_expire_date = Column(Date, nullable=True, comment="General Liability Expiration")
    
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="jobs")
    assignments = relationship("AssignmentTracking", back_populates="job", cascade="all, delete-orphan")