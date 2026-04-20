# app/schemas/schemas_core.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.models_core import UserRole

# ----------------------------------------
# USER & AUTHENTICATION SCHEMAS
# ----------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Strong password required for enterprise security")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    last_login_at: Optional[datetime] = None
    is_locked: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ----------------------------------------
# SYSTEM AUDIT LOG SCHEMAS
# ----------------------------------------
class AuditLogBase(BaseModel):
    table_name: str
    record_id: int
    action: str
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    changed_by_user_id: Optional[int] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    changed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)