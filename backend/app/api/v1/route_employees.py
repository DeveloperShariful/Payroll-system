# app/api/v1/route_employees.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.api.dependencies import get_modern_db
from app.schemas.schema_employee import EmployeeCreate, EmployeeResponse
from app.models.modern_postgres.table_employee import Employee

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_new_employee(employee: EmployeeCreate, db: Session = Depends(get_modern_db)):
    """
    Create an employee. Handles modern core fields + dynamic UI form data (JSONB).
    """
    existing_emp = db.query(Employee).filter(Employee.email == employee.email).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Convert Pydantic schema to SQLAlchemy model
    new_employee = Employee(**employee.model_dump(exclude_unset=True))
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return new_employee

@router.get("/{emp_id}", response_model=EmployeeResponse)
def get_employee(emp_id: int, db: Session = Depends(get_modern_db)):
    """Fetch an employee and all their dynamic/legacy data"""
    employee = db.query(Employee).filter(Employee.id == emp_id, Employee.is_deleted == False).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

# ==========================================
# NEW ENDPOINT: Fetch all employees for Dashboard
# ==========================================
@router.get("/", response_model=List[EmployeeResponse])
def get_all_employees(
    search: Optional[str] = Query(None, description="Search by name or email"),
    dept_id: Optional[int] = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_modern_db)
):
    """Fetch all employees for the dashboard with optional filtering"""
    # শুধু অ্যাক্টিভ এমপ্লয়িদের ফিল্টার করছি
    query = db.query(Employee).filter(Employee.is_deleted == False)
    
    # যদি সার্চ ইনপুট থাকে
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.email.ilike(search_term)
            )
        )
        
    # যদি ডিপার্টমেন্ট ফিল্টার থাকে
    if dept_id:
        query = query.filter(Employee.department_id == dept_id)
        
    return query.all()