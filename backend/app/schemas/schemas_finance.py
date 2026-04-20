# app/schemas/schemas_finance.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# ==========================================
# 1. PAYROLL RULES SCHEMAS (Tax & Union Rates)
# ==========================================
class PayrollRuleBase(BaseModel):
    rule_name: str = Field(..., max_length=100)
    rule_type: str = Field(..., max_length=50)
    state_code: Optional[str] = Field(None, max_length=5)
    percentage_rate: Decimal = Field(default=Decimal('0.0000'), decimal_places=4)
    fixed_amount: Decimal = Field(default=Decimal('0.00'), decimal_places=2)
    is_active: bool = True

class PayrollRuleCreate(PayrollRuleBase):
    pass

class PayrollRuleUpdate(BaseModel):
    percentage_rate: Optional[Decimal] = Field(None, decimal_places=4)
    fixed_amount: Optional[Decimal] = Field(None, decimal_places=2)
    is_active: Optional[bool] = None

class PayrollRuleResponse(PayrollRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 2. PAYROLL SCHEMAS (Employee Pay Stubs)
# ==========================================
class PayrollBase(BaseModel):
    employee_id: int = Field(..., gt=0)
    pay_period_start: date
    pay_period_end: date
    
    regular_hours: Decimal = Field(default=Decimal('0.00'), ge=0, decimal_places=2)
    overtime_hours: Decimal = Field(default=Decimal('0.00'), ge=0, decimal_places=2)
    double_time_hours: Decimal = Field(default=Decimal('0.00'), ge=0, decimal_places=2)
    hourly_base_rate: Decimal = Field(..., gt=0, decimal_places=4)
    
    union_dues: Decimal = Field(default=Decimal('0.00'), ge=0, decimal_places=4)
    medical_deduction: Decimal = Field(default=Decimal('0.00'), ge=0, decimal_places=4)

    gross_pay: Optional[Decimal] = Field(default=Decimal('0.00'), decimal_places=4)
    federal_tax: Optional[Decimal] = Field(default=Decimal('0.00'), decimal_places=4)
    state_tax: Optional[Decimal] = Field(default=Decimal('0.00'), decimal_places=4)
    net_pay: Optional[Decimal] = Field(default=Decimal('0.00'), decimal_places=4)
    
    status: str = Field(default="DRAFT")

class PayrollCreate(PayrollBase):
    pass

class PayrollResponse(PayrollBase):
    id: int
    payment_date: Optional[date]
    calculation_metadata: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 3. INVOICE SCHEMAS (Customer Billing)
# ==========================================
class InvoiceRequest(BaseModel):
    """Payload sent by HR/Admin to generate a new invoice"""
    job_id: int = Field(..., gt=0)
    start_date: date
    end_date: date

class InvoiceBase(BaseModel):
    customer_id: int = Field(..., gt=0)
    job_id: Optional[int] = Field(None, gt=0)
    invoice_number: str = Field(..., max_length=50)
    
    billing_period_start: date
    billing_period_end: date
    
    total_hours: Decimal = Field(default=Decimal('0.00'), decimal_places=2)
    
    subtotal_amount: Decimal = Field(default=Decimal('0.00'), decimal_places=4)
    tax_amount: Decimal = Field(default=Decimal('0.00'), decimal_places=4)
    total_amount: Decimal = Field(default=Decimal('0.00'), decimal_places=4)
    
    status: str = Field(default="UNPAID")
    is_sent_to_customer: bool = False

class InvoiceResponse(InvoiceBase):
    """Full payload sent back to NextJS UI"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)