# app/schemas/schema_timesheet.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.modern_postgres.table_timesheet import TimesheetStatus

class TimesheetBase(BaseModel):
    employee_id: int = Field(..., gt=0, description="Valid Employee ID")
    customer_id: Optional[int] = Field(None, gt=0, description="Optional Customer/Site ID")
    cost_center_code: Optional[str] = Field(None, max_length=50)
    
    work_date: date
    
    regular_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24)
    overtime_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24)
    double_time_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24)

class TimesheetCreate(TimesheetBase):
    """Schema used when employee submits their daily hours"""
    pass

class TimesheetApproval(BaseModel):
    """Schema used by Supervisor or HR to approve/reject hours"""
    status: TimesheetStatus
    supervisor_notes: Optional[str] = Field(None, max_length=1000)
    approved_by_id: Optional[int] = Field(None, description="ID of the approving user")

class TimesheetResponse(TimesheetBase):
    """Full payload sent back to NextJS UI"""
    id: int
    status: TimesheetStatus
    supervisor_notes: Optional[str]
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)