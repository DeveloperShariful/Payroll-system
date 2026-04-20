# app/api/v1/route_users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import RoleChecker
from app.models.modern_postgres.table_user import User, UserRole
from app.schemas.schema_user import UserCreate, UserResponse
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["User Management"])

allow_admin_only = RoleChecker([UserRole.ADMIN])

# Updated Schema for Edit Modal
class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(allow_admin_only)])
def get_all_users(db: Session = Depends(get_modern_db)):
    return db.query(User).filter(User.is_deleted == False).order_by(User.id.desc()).all()

@router.post("/", response_model=UserResponse, dependencies=[Depends(allow_admin_only)])
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

@router.patch("/{user_id}", response_model=UserResponse, dependencies=[Depends(allow_admin_only)])
def update_user_access(user_id: int, user_in: UserUpdate, db: Session = Depends(get_modern_db)):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle Email Update (Must check if new email is already taken by someone else)
    if user_in.email and user_in.email != user.email:
        email_taken = db.query(User).filter(User.email == user_in.email).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="This email is already registered to another user")
        user.email = user_in.email

    # Handle Password Update (Hash the new password)
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    db.commit()
    db.refresh(user)
    return user