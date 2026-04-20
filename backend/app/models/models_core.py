# app/models/models_core.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, declarative_mixin
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import enum

# আপনার নতুন প্ল্যান অনুযায়ী db_setup.py থেকে BaseModern কল করা হয়েছে
from app.core.db_setup import BaseModern

# =====================================================================
# ১. CORE MIXIN (Audit Trail - সব টেবিলে যুক্ত হবে)
# =====================================================================
@declarative_mixin
class AuditTrailMixin:
    """
    Enterprise Standard Mixin.
    পে-রোল বা ফিন্যান্সিয়াল সিস্টেমে ডাটা ট্র্যাকিংয়ের জন্য ১০০% বাধ্যতামূলক।
    পুরোনো MS Access এর ডাটা ট্র্যাক রাখার জন্য 'legacy_id' রাখা হয়েছে।
    """
    legacy_id = Column(String(100), index=True, nullable=True, comment="Original ID from Legacy MS Access/SQL Server")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    
    created_by = Column(String(100), nullable=True, comment="Email/ID of the creator")
    updated_by = Column(String(100), nullable=True, comment="Email/ID of the last updater")
    
    # Soft Delete: পে-রোল সিস্টেমে কখনোই ডাটা পার্মানেন্টলি ডিলিট করা যায় না (Legal Compliance)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def soft_delete(self):
        """Helper method to securely soft-delete a record"""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)

# =====================================================================
# ২. USER & ACCESS CONTROL (সিস্টেমের ইউজার্স)
# =====================================================================
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HR_MANAGER = "HR_MANAGER"
    SUPERVISOR = "SUPERVISOR"
    EMPLOYEE = "EMPLOYEE"

class User(BaseModern, AuditTrailMixin):
    """
    Core User Table. 
    100% Requirement Additions: ফিন্যান্সিয়াল সিকিউরিটির জন্য লগইন ট্র্যাকিং এবং লকআউট সিস্টেম যোগ করা হয়েছে।
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # --- New 100% Enterprise Security Additions ---
    last_login_at = Column(DateTime(timezone=True), nullable=True, comment="Track last login for security audit")
    failed_login_attempts = Column(Integer, default=0, nullable=False, comment="Prevent brute-force attacks")
    is_locked = Column(Boolean, default=False, nullable=False, comment="Locked automatically after multiple failed attempts")

    # Relationships (Circular Import রোধ করতে String Reference ব্যবহার করা হয়েছে)
    audit_logs_created = relationship("AuditLog", back_populates="changed_by_user", foreign_keys="[AuditLog.changed_by_user_id]")

# =====================================================================
# ৩. DEPARTMENT / ORGANIZATION 
# =====================================================================
class Department(BaseModern, AuditTrailMixin):
    """
    কোম্পানির ডিপার্টমেন্ট বা বিভাগসমূহ।
    """
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    department_code = Column(String(50), unique=True, index=True, nullable=False) # Example: "HR-001"
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # One-to-Many: One Department has many Employees
    # 'Employee' স্ট্রিং হিসেবে দেওয়া হয়েছে কারণ Employee টেবিল models_profiles.py তে থাকবে
    employees = relationship("Employee", back_populates="department")

# =====================================================================
# ৪. SYSTEM AUDIT LOGS (ফাইন্যান্স ও ডাটা কমপ্লায়েন্স)
# =====================================================================
class AuditLog(BaseModern):
    """
    অত্যন্ত গুরুত্বপূর্ণ: কে, কখন, কোন পে-রোল বা এমপ্লয়ি ডাটায় কী পরিবর্তন করেছে 
    তা ট্র্যাকিং করার জন্য। (JSONB ব্যবহার করে ডাটার Before & After স্টেট রাখা হবে)।
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=False, index=True)
    
    action = Column(String(50), nullable=False) # INSERT, UPDATE, DELETE, RESTORE
    
    # JSONB is perfect for storing dynamic before/after states
    old_data = Column(JSONB, nullable=True)
    new_data = Column(JSONB, nullable=True)
    
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    changed_by_user = relationship("User", back_populates="audit_logs_created")

# =====================================================================
# ৫. DATA MIGRATION LOGS (MS Access -> Postgres)
# =====================================================================
class MigrationLog(BaseModern):
    """
    ১.৭৫ লক্ষ কর্মী এবং ৯৩ হাজার কাস্টমারের ডাটা MS Access থেকে আনার সময় 
    ব্যাচ প্রসেসিং ট্র্যাকিং করার জন্য।
    """
    __tablename__ = "migration_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="IN_PROGRESS", nullable=False) # IN_PROGRESS, SUCCESS, FAILED
    
    total_records = Column(Integer, default=0)
    migrated_records = Column(Integer, default=0)
    skipped_records = Column(Integer, default=0)
    
    error_message = Column(String(1000), nullable=True)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)