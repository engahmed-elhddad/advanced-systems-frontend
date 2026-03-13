"""Categories API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models import Category
from app.schemas import CategoryCreate, CategoryRead

router = APIRouter()


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.name).all()
    return {"categories": cats, "total": len(cats)}


@router.get("/categories/{slug}", response_model=CategoryRead)
def get_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug.lower()).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat
