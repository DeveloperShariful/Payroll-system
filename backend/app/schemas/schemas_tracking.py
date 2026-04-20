# app/schemas/schemas_tracking.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# models_tracking.py থেকে Enum ইমপোর্ট করা হলো
from app.models.models_tracking import TimesheetStatus

# ==========================================
# 1. JOB / SITE SCHEMAS
# ==========================================
class JobBase(BaseModel):
    customer_id: int = Field(..., gt=0)
    job_name: str = Field(..., min_length=2, max_length=200)
    job_location: Optional[str] = Field(None, max_length=500)
    
    # Client Requirement: Compliance & Contracts (Screenshot 1 & 2)
    contract_date: Optional[date] = None
    wc_expire_date: Optional[date] = Field(None, description="Workers Comp Expiration")
    gl_expire_date: Optional[date] = Field(None, description="General Liability Expiration")
    
    is_active: bool = True

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    job_name: Optional[str] = Field(None, min_length=2, max_length=200)
    job_location: Optional[str] = Field(None, max_length=500)
    contract_date: Optional[date] = None
    wc_expire_date: Optional[date] = None
    gl_expire_date: Optional[date] = None
    is_active: Optional[bool] = None

class JobResponse(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. ASSIGNMENT TRACKING SCHEMAS
# ==========================================
class AssignmentBase(BaseModel):
    job_id: int = Field(..., gt=0)
    employee_id: int = Field(..., gt=0)
    
    # Financial Rates (Strictly Decimal for Payroll & Invoice accuracy)
    pay_rate: Decimal = Field(..., gt=0, decimal_places=4)
    bill_rate: Decimal = Field(..., gt=0, decimal_places=4)
    bill_rate_ot: Decimal = Field(..., gt=0, decimal_places=4)
    
    assignment_start_date: date
    assignment_end_date: Optional[date] = None
    is_active: bool = True

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    pay_rate: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    bill_rate: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    bill_rate_ot: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    assignment_end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. TIMESHEET SCHEMAS
# ==========================================
class TimesheetBase(BaseModel):
    employee_id: int = Field(..., gt=0, description="Valid Employee ID")
    customer_id: Optional[int] = Field(None, gt=0, description="Optional Customer ID")
    job_id: Optional[int] = Field(None, gt=0, description="Link directly to the assigned job")
    cost_center_code: Optional[str] = Field(None, max_length=50)
    
    work_date: date
    
    regular_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24, decimal_places=2)
    overtime_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24, decimal_places=2)
    double_time_hours: Decimal = Field(default=Decimal('0.00'), ge=0, le=24, decimal_places=2)

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