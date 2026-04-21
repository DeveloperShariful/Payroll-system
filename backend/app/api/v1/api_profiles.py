# app/api/v1/api_profiles.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from sqlalchemy.orm.attributes import flag_modified

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

@router_customers.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer_profile(customer_id: int, customer_in: CustomerUpdate, db: Session = Depends(get_modern_db)):
    """
    100% Enterprise Update Logic: 
    Updates core fields and merges JSONB (Compliance & Dynamic Attributes)
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Extract update data as dictionary, excluding unset fields
    update_data = customer_in.model_dump(exclude_unset=True)

    # Handle Nested JSONB Update (Ensures we don't wipe out existing legacy data)
    if "compliance_tracking" in update_data:
        db_customer.compliance_tracking = update_data.pop("compliance_tracking")
    
    if "dynamic_attributes" in update_data:
        # Merge existing JSON with new data
        current_attrs = db_customer.dynamic_attributes or {}
        current_attrs.update(update_data.pop("dynamic_attributes"))
        db_customer.dynamic_attributes = current_attrs

    # Update other core fields (name, industry, email, etc.)
    for key, value in update_data.items():
        setattr(db_customer, key, value)

    db.commit()
    db.refresh(db_customer)
    return db_customer
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

@router_employees.patch("/{emp_id}", response_model=EmployeeResponse)
def update_employee_profile(emp_id: int, employee_in: EmployeeUpdate, db: Session = Depends(get_modern_db)):
    db_employee = db.query(Employee).filter(Employee.id == emp_id, Employee.is_deleted == False).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee record not found.")

    # Convert schema to dict and exclude unset fields
    update_data = employee_in.model_dump(exclude_unset=True)

    # 1. Handle Compliance Tracking Update
    if "compliance_tracking" in update_data:
        db_employee.compliance_tracking = update_data.pop("compliance_tracking")
    
    # 2. Handle Dynamic Attributes (Bank/Union) with Deep Merge
    if "dynamic_attributes" in update_data:
        new_attrs = update_data.pop("dynamic_attributes")
        
        # যদি ডাটাবেসে আগে থেকে কিছু না থাকে তবে নতুন ডিকশনারি তৈরি করবে
        if db_employee.dynamic_attributes is None:
            db_employee.dynamic_attributes = {}

        # Deep merge to protect legacy_custom_fields while updating bank/union
        for key, value in new_attrs.items():
            db_employee.dynamic_attributes[key] = value
        
        # ⚠️ CRITICAL: Tell SQLAlchemy that JSONB content has changed!
        flag_modified(db_employee, "dynamic_attributes")

    # 3. Update other core fields
    for key, value in update_data.items():
        setattr(db_employee, key, value)

    try:
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except Exception as e:
        db.rollback()
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail="Database commit failed.")