# app/schemas/schema_customer.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    customer_code: str = Field(..., min_length=2, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    dynamic_attributes: Dict[str, Any] = Field(default_factory=dict)

class CustomerCreate(CustomerBase):
    legacy_id: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    dynamic_attributes: Optional[Dict[str, Any]] = None

class CustomerResponse(CustomerBase):
    id: int
    legacy_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)