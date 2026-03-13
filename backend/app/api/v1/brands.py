"""Brands API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models import Brand
from app.schemas import BrandCreate, BrandRead

router = APIRouter()


@router.get("/brands")
def list_brands(db: Session = Depends(get_db)):
    brands = db.query(Brand).order_by(Brand.name).all()
    return {"brands": brands, "total": len(brands)}


@router.get("/brands/{slug}", response_model=BrandRead)
def get_brand(slug: str, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.slug == slug.lower()).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand
