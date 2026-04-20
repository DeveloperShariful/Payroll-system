# app/api/v1/route_invoices.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from pydantic import BaseModel
from app.api.dependencies import get_modern_db
from app.api.dependencies_auth import RoleChecker
from app.models.modern_postgres.table_user import UserRole
from app.models.modern_postgres.table_invoice import Invoice
from app.services.service_invoice_logic import generate_job_invoice

router = APIRouter(prefix="/invoices", tags=["Customer Invoicing System"])

allow_hr_admin = RoleChecker([UserRole.ADMIN, UserRole.HR_MANAGER])

class InvoiceRequest(BaseModel):
    job_id: int
    start_date: date
    end_date: date

@router.get("/history", dependencies=[Depends(allow_hr_admin)])
def get_invoice_history(db: Session = Depends(get_modern_db)):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

@router.post("/generate", dependencies=[Depends(allow_hr_admin)])
def create_customer_invoice(req: InvoiceRequest, db: Session = Depends(get_modern_db)):
    """
    Triggers the invoicing engine to calculate and save a new invoice.
    """
    invoice = generate_job_invoice(db, req.job_id, req.start_date, req.end_date)
    if not invoice:
        raise HTTPException(status_code=400, detail="No approved hours found for this period to invoice.")
    return invoice

@router.patch("/{invoice_id}/pay", dependencies=[Depends(allow_hr_admin)])
def mark_invoice_as_paid(invoice_id: int, db: Session = Depends(get_modern_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = "PAID"
    db.commit()
    return {"message": "Invoice marked as paid"}