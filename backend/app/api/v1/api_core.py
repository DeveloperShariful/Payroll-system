# app/api/v1/api_core.py
from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.core.config_settings import settings
from app.core.db_setup import get_modern_db
from app.api.dependencies_core import get_current_user, RoleChecker
from app.core.security import verify_password, create_access_token, get_password_hash

from app.models.models_core import User, UserRole, AuditLog
from app.schemas.schemas_core import Token, UserCreate, UserUpdate, UserResponse, AuditLogResponse

# ==========================================
# ROUTERS
# ==========================================
router_auth = APIRouter(prefix="/auth", tags=["Authentication"])
router_users = APIRouter(prefix="/users", tags=["User Management"])
router_audit = APIRouter(prefix="/audit-logs", tags=["System Audit & Compliance"])

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================
@router_auth.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_modern_db)):
    user = db.query(User).filter(User.email == form_data.username, User.is_deleted == False).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account is locked due to multiple failed login attempts. Contact Admin."
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# USER MANAGEMENT ENDPOINTS
# ==========================================
allow_admin_only = RoleChecker([UserRole.ADMIN])

@router_users.get("/", response_model=List[UserResponse], dependencies=[Depends(allow_admin_only)])
def get_all_users(db: Session = Depends(get_modern_db)):
    return db.query(User).filter(User.is_deleted == False).order_by(User.id.desc()).all()

@router_users.post("/", response_model=UserResponse, dependencies=[Depends(allow_admin_only)])
def create_new_user(user_in: UserCreate, db: Session = Depends(get_modern_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router_users.patch("/{user_id}", response_model=UserResponse, dependencies=[Depends(allow_admin_only)])
def update_user_access(user_id: int, user_in: UserUpdate, db: Session = Depends(get_modern_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.email and user_in.email != user.email:
        email_taken = db.query(User).filter(User.email == user_in.email).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="This email is already registered to another user")
        user.email = user_in.email

    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    db.commit()
    db.refresh(user)
    return user


# ==========================================
# SYSTEM AUDIT LOG ENDPOINTS
# ==========================================
allow_compliance_officers = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])

@router_audit.get("/", response_model=List[AuditLogResponse], dependencies=[Depends(allow_compliance_officers)])
def get_system_audit_logs(
    table_name: str = Query(None, description="Filter by specific table (e.g., payrolls, employees)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
        
    logs = query.order_by(AuditLog.changed_at.desc()).offset(offset).limit(limit).all()
    return logs