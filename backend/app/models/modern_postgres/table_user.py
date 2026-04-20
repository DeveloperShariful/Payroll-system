# app/models/modern_postgres/table_user.py
from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from app.core.db_modern_postgres import BaseModern
from app.models.mixins_audit_trail import AuditTrailMixin

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HR_MANAGER = "HR_MANAGER"
    SUPERVISOR = "SUPERVISOR"
    EMPLOYEE = "EMPLOYEE"

class User(BaseModern, AuditTrailMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)