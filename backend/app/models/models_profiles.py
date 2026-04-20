# app/models/models_profiles.py
# app/models/models_profiles.py
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.db_setup import BaseModern
from app.models.models_core import AuditTrailMixin

class Customer(BaseModern, AuditTrailMixin):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    compliance_tracking = Column(JSONB, default=dict, nullable=False, server_default='{}')
    dynamic_attributes = Column(JSONB, default=dict, nullable=False, server_default='{}')

    jobs = relationship("Job", back_populates="customer", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")


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
    
    compliance_tracking = Column(JSONB, default=dict, nullable=False, server_default='{}')
    dynamic_attributes = Column(JSONB, default=dict, nullable=False, server_default='{}')

    department = relationship("Department", back_populates="employees")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    assignments = relationship("AssignmentTracking", back_populates="employee", cascade="all, delete-orphan")
    timesheets = relationship("Timesheet", back_populates="employee", cascade="all, delete-orphan")