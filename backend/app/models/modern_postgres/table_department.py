# app/models/modern_postgres/table_department.py
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Department(BaseModern, AuditTrailMixin):
    """
    Modern, normalized Department table for PostgreSQL.
    """
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    department_code = Column(String(50), unique=True, index=True, nullable=False) # Example: "HR-001"
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(String(500), nullable=True)

    # One-to-Many Relationship: One Department has many Employees
    employees = relationship("Employee", back_populates="department", cascade="all, delete-orphan")