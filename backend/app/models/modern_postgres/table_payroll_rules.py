# app/models/modern_postgres/table_payroll_rules.py
from sqlalchemy import Column, Integer, String, Numeric, Boolean
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class PayrollRule(BaseModern, AuditTrailMixin):
    __tablename__ = "payroll_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), unique=True, index=True, nullable=False)
    rule_type = Column(String(50), nullable=False)
    state_code = Column(String(5), nullable=True, index=True)
    
    percentage_rate = Column(Numeric(5, 4), default=0.0000, nullable=False)
    fixed_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)