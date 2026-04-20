# app/models/modern_postgres/table_employee.py
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Employee(BaseModern, AuditTrailMixin):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    ssn_last_four = Column(String(4), nullable=True)
    hire_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    
    # REMOVED: customer_id (Employees are now assigned to Jobs via AssignmentTracking)

    dynamic_attributes = Column(JSONB, default=dict, nullable=False, server_default='{}')

    # Relationships
    department = relationship("Department")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    assignments = relationship("AssignmentTracking", back_populates="employee", cascade="all, delete-orphan")