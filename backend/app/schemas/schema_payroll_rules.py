# app/schemas/schema_payroll_rules.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import datetime

class PayrollRuleBase(BaseModel):
    rule_name: str = Field(..., max_length=100)
    rule_type: str = Field(..., max_length=50)
    state_code: Optional[str] = Field(None, max_length=5)
    percentage_rate: Decimal = Field(default=Decimal('0.0000'))
    fixed_amount: Decimal = Field(default=Decimal('0.00'))
    is_active: bool = True

class PayrollRuleCreate(PayrollRuleBase):
    pass

class PayrollRuleUpdate(BaseModel):
    percentage_rate: Optional[Decimal] = None
    fixed_amount: Optional[Decimal] = None
    is_active: Optional[bool] = None

class PayrollRuleResponse(PayrollRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)