# app/models/modern_postgres/table_customer.py
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class Customer(BaseModern, AuditTrailMixin):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    dynamic_attributes = Column(JSONB, default=dict, nullable=False, server_default='{}')

    # Relationships (A customer has many Jobs)
    jobs = relationship("Job", back_populates="customer", cascade="all, delete-orphan")