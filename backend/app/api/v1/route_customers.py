# app/api/v1/route_customers.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.api.dependencies import get_modern_db
from app.models.modern_postgres.table_customer import Customer
from app.schemas.schema_customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers & Clients"])

@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_modern_db)):
    existing_customer = db.query(Customer).filter(Customer.customer_code == customer_in.customer_code).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer code already exists")

    new_customer = Customer(**customer_in.model_dump(exclude_unset=True))
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.get("/", response_model=List[CustomerResponse])
def get_all_customers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
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
    return query.all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_modern_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer