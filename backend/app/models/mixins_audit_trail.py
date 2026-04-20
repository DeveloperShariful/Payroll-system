# app/models/mixins_audit_trail.py
from sqlalchemy import Column, DateTime, Boolean, String
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime, timezone

class AuditTrailMixin:
    """
    Enterprise Standard Mixin.
    Applies common audit fields to any SQLAlchemy model that inherits it.
    Client requirement: Payroll systems require high precision and auditability.
    """
    
    # Store legacy ID to keep track of mapping between MS Access and New Postgres
    legacy_id = Column(String(100), index=True, nullable=True, comment="Original ID from MS Access/SQL Server")

    # Timezone aware datetimes are critical for financial/payroll applications
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Optional: Tracking WHO made the changes (Can be linked to a User table later)
    created_by = Column(String(100), nullable=True, comment="Email or ID of the user who created this record")
    updated_by = Column(String(100), nullable=True, comment="Email or ID of the user who last updated this record")

    # SOFT DELETE: Payroll records must never be hard-deleted from the database.
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def soft_delete(self):
        """Helper method to soft delete a record"""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)