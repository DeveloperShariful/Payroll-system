# app/schemas/schema_employee.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import date, datetime

class BankDetails(BaseModel):
    bank_name: str
    account_number: str
    routing_number: str
    account_type: str = "Checking"

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone_number: str

class UnionInfo(BaseModel):
    is_union_member: bool = False
    union_local_number: Optional[str] = None

class EmployeeDynamicAttributes(BaseModel):
    bank_details: Optional[BankDetails] = None
    emergency_contact: Optional[EmergencyContact] = None
    union_info: Optional[UnionInfo] = None
    legacy_custom_fields: Optional[Dict[str, Any]] = None

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department_id: int = Field(..., gt=0)
    customer_id: Optional[int] = None
    hire_date: date
    ssn_last_four: Optional[str] = Field(None, min_length=4, max_length=4, pattern=r"^\d{4}$")
    is_active: bool = True
    dynamic_attributes: EmployeeDynamicAttributes = Field(default_factory=EmployeeDynamicAttributes)

class EmployeeCreate(EmployeeBase):
    legacy_id: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    department_id: Optional[int] = Field(None, gt=0)
    customer_id: Optional[int] = None
    is_active: Optional[bool] = None
    dynamic_attributes: Optional[EmployeeDynamicAttributes] = None

class EmployeeResponse(EmployeeBase):
    id: int
    legacy_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)