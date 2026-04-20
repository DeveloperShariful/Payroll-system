# app/api/v1/api_profiles.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.core.db_setup import get_modern_db
from app.models.models_profiles import Customer, Employee
from app.schemas.schemas_profiles import CustomerCreate, CustomerUpdate, CustomerResponse, EmployeeCreate, EmployeeUpdate, EmployeeResponse

# ==========================================
# ROUTERS
# ==========================================
router_customers = APIRouter(prefix="/customers", tags=["Customers & Clients"])
router_employees = APIRouter(prefix="/employees", tags=["Employees"])


# ==========================================
# CUSTOMERS ENDPOINTS
# ==========================================
@router_customers.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_modern_db)):
    existing_customer = db.query(Customer).filter(Customer.customer_code == customer_in.customer_code).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer code already exists")

    new_customer = Customer(**customer_in.model_dump(exclude_unset=True))
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router_customers.get("/", response_model=List[CustomerResponse])
def get_all_customers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    limit: int = Query(100, ge=1, le=1000, description="Pagination limit to prevent server crash"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db)
):
    query = db.query(Customer).filter(Customer.is_deleted == False)
    
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(search_term),
                Customer.customer_code.ilike(search_term),
                Customer.contact_email.ilike(search_term)
            )
        )
        
    return query.order_by(Customer.id).offset(offset).limit(limit).all()

@router_customers.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_modern_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# ==========================================
# EMPLOYEES ENDPOINTS
# ==========================================
@router_employees.post("/", response_model=EmployeeResponse, status_code=201)
def create_new_employee(employee_in: EmployeeCreate, db: Session = Depends(get_modern_db)):
    existing_emp = db.query(Employee).filter(Employee.email == employee_in.email).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_employee = Employee(**employee_in.model_dump(exclude_unset=True))
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router_employees.get("/", response_model=List[EmployeeResponse])
def get_all_employees(
    search: Optional[str] = Query(None, description="Search by name or email"),
    dept_id: Optional[int] = Query(None, description="Filter by department ID"),
    limit: int = Query(100, ge=1, le=1000, description="Pagination limit to prevent server crash"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_modern_db)
):
    query = db.query(Employee).filter(Employee.is_deleted == False)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.email.ilike(search_term)
            )
        )
        
    if dept_id:
        query = query.filter(Employee.department_id == dept_id)
        
    return query.order_by(Employee.id).offset(offset).limit(limit).all()

@router_employees.get("/{emp_id}", response_model=EmployeeResponse)
def get_employee(emp_id: int, db: Session = Depends(get_modern_db)):
    employee = db.query(Employee).filter(Employee.id == emp_id, Employee.is_deleted == False).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee