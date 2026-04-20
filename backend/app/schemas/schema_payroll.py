# app/schemas/schema_payroll.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class PayrollBase(BaseModel):
    employee_id: int = Field(...)
    pay_period_start: date
    pay_period_end: date
    
    regular_hours: Decimal = Field(default=Decimal('0.00'), ge=0)
    overtime_hours: Decimal = Field(default=Decimal('0.00'), ge=0)
    double_time_hours: Decimal = Field(default=Decimal('0.00'), ge=0)
    hourly_base_rate: Decimal = Field(..., gt=0)
    
    union_dues: Decimal = Field(default=Decimal('0.00'), ge=0)
    medical_deduction: Decimal = Field(default=Decimal('0.00'), ge=0)

    gross_pay: Optional[Decimal] = Field(default=Decimal('0.00'))
    federal_tax: Optional[Decimal] = Field(default=Decimal('0.00'))
    state_tax: Optional[Decimal] = Field(default=Decimal('0.00'))
    net_pay: Optional[Decimal] = Field(default=Decimal('0.00'))
    status: str = Field(default="DRAFT")

class PayrollCreate(PayrollBase):
    pass

class PayrollResponse(PayrollBase):
    id: int
    payment_date: Optional[date]
    calculation_metadata: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)