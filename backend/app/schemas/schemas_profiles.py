# app/schemas/schemas_profiles.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import date, datetime

# ==========================================
# 1. CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    customer_code: str = Field(..., min_length=2, max_length=50)
    industry: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    
    # 100% Client Requirement Additions (Matched with models_profiles.py)
    compliance_tracking: Dict[str, Any] = Field(default_factory=dict, description="Stores license renewal dates for alerts")
    dynamic_attributes: Dict[str, Any] = Field(default_factory=dict, description="Legacy MS Access 200+ columns go here")

class CustomerCreate(CustomerBase):
    legacy_id: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    compliance_tracking: Optional[Dict[str, Any]] = None
    dynamic_attributes: Optional[Dict[str, Any]] = None

class CustomerResponse(CustomerBase):
    id: int
    legacy_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. EMPLOYEE SCHEMAS
# ==========================================
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
    
    # 100% Client Requirement Additions
    compliance_tracking: Dict[str, Any] = Field(default_factory=dict, description="Stores WC, PL, and other license dates")
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
    compliance_tracking: Optional[Dict[str, Any]] = None
    dynamic_attributes: Optional[EmployeeDynamicAttributes] = None

class EmployeeResponse(EmployeeBase):
    id: int
    legacy_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)