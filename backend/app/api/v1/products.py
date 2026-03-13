"""Products API router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from app.core.db import get_db
from app.models import Product, Brand, Category
from app.schemas import ProductRead, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("/products")
def list_products(
    q: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_active == True)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Product.part_number.ilike(like),
                Product.description.ilike(like),
            )
        )
    if brand:
        query = query.join(Brand).filter(Brand.name.ilike(f"%{brand}%"))
    if category:
        query = query.join(Category).filter(Category.name.ilike(f"%{category}%"))

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "products": [_serialize(p) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),
    }


@router.get("/product/{part_number}")
def get_product(part_number: str, db: Session = Depends(get_db)):
    normalized = part_number.replace(" ", "").upper()
    p = db.query(Product).filter(
        func.upper(func.replace(Product.part_number, " ", "")) == normalized
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize(p, detail=True)


@router.get("/related/{part_number}")
def get_related(part_number: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.part_number == part_number.upper()).first()
    if not p:
        return {"related": []}
    query = db.query(Product).filter(Product.id != p.id)
    if p.category_id:
        query = query.filter(Product.category_id == p.category_id)
    related = query.limit(8).all()
    return {"related": [r.part_number for r in related]}


def _serialize(p: Product, detail: bool = False) -> dict:
    brand = p.brand_rel
    category = p.category_rel
    images = [img.url for img in p.images] if p.images else []
    result = {
        "id": p.id,
        "part_number": p.part_number,
        "brand": brand.name if brand else None,
        "manufacturer": brand.name if brand else None,
        "category": category.name if category else None,
        "series": p.series,
        "description": p.description,
        "quantity": p.quantity,
        "availability": p.availability,
        "lead_time": p.lead_time,
        "condition": p.condition,
        "images": images,
        "image": images[0] if images else None,
    }
    if detail:
        result["specifications"] = p.specifications or {}
        result["datasheets"] = [
            {"id": d.id, "filename": d.filename, "url": d.url}
            for d in (p.datasheets or [])
        ]
    return result
