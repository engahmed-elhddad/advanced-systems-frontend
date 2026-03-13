"""Supplier service — business logic for supplier management."""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import Supplier, Product
from app.schemas import SupplierCreate, SupplierUpdate


class SupplierService:
    def __init__(self, db: Session):
        self.db = db

    def list_suppliers(self) -> List[Supplier]:
        return self.db.query(Supplier).order_by(Supplier.name).all()

    def get_by_id(self, supplier_id: int) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def create(self, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def update(self, supplier: Supplier, data: SupplierUpdate) -> Supplier:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(supplier, field, value)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def delete(self, supplier: Supplier) -> None:
        self.db.delete(supplier)
        self.db.commit()

    def link_product(self, supplier: Supplier, product: Product) -> None:
        if product not in supplier.products:
            supplier.products.append(product)
            self.db.commit()

    def unlink_product(self, supplier: Supplier, product: Product) -> None:
        if product in supplier.products:
            supplier.products.remove(product)
            self.db.commit()
