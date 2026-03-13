"""Suppliers API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import require_admin
from app.models import Supplier
from app.schemas import SupplierCreate, SupplierUpdate, SupplierRead

router = APIRouter()


@router.get("/suppliers")
def list_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).order_by(Supplier.name).all()
    return {"suppliers": suppliers, "total": len(suppliers)}


@router.get("/suppliers/{supplier_id}", response_model=SupplierRead)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s


@router.post("/admin/suppliers", response_model=SupplierRead, status_code=201)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    s = Supplier(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/admin/suppliers/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/admin/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(s)
    db.commit()
