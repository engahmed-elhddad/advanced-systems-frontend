"""Admin dashboard, product CRUD, media upload, and search management router."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.db import get_db
from app.core.security import require_admin
from app.models import Product, RFQ, Supplier, Brand, Category, ProductImage, Datasheet
from app.schemas import (
    ProductCreate, ProductUpdate, ProductRead,
    BrandCreate, BrandRead,
    CategoryCreate, CategoryRead,
)
from app.services.product_service import ProductService
from app.services.media_service import MediaService
from app.search.indexer import index_all_products

router = APIRouter()


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    total_products = db.query(Product).filter(Product.is_active == True).count()
    total_rfqs = db.query(RFQ).count()
    pending_rfqs = db.query(RFQ).filter(RFQ.status == "pending").count()
    total_suppliers = db.query(Supplier).count()
    total_brands = db.query(Brand).count()
    total_categories = db.query(Category).count()

    recent_rfqs = (
        db.query(RFQ)
        .order_by(RFQ.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "stats": {
            "total_products": total_products,
            "total_rfqs": total_rfqs,
            "pending_rfqs": pending_rfqs,
            "total_suppliers": total_suppliers,
            "total_brands": total_brands,
            "total_categories": total_categories,
        },
        "recent_rfqs": [
            {
                "id": r.id,
                "part_number": r.part_number,
                "email": r.email,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_rfqs
        ],
    }


# ── Product CRUD ───────────────────────────────────────────────────────────────

@router.get("/products")
def admin_list_products(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    products, total = svc.list_products(q=q, page=page, per_page=per_page)
    return {
        "products": [_serialize(p, detail=True) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),
    }


@router.post("/products", status_code=201)
def admin_create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    normalized_part = data.part_number.strip().upper()
    existing = db.query(Product).filter(Product.part_number == normalized_part).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product with this part number already exists.")
    data.part_number = normalized_part
    svc = ProductService(db)
    product = svc.create(data)
    return _serialize(product, detail=True)


@router.patch("/products/{product_id}")
def admin_update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    updated = svc.update(product, data)
    return _serialize(updated, detail=True)


@router.delete("/products/{product_id}", status_code=204)
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    svc.soft_delete(product)


# ── Product image upload ───────────────────────────────────────────────────────

@router.post("/products/{product_id}/images", status_code=201)
async def admin_upload_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    media = MediaService()
    url = await media.save_product_image(product.part_number, file)
    image = svc.add_image(product, url, is_primary=is_primary)
    return {"id": image.id, "url": image.url, "is_primary": image.is_primary}


@router.delete("/products/{product_id}/images/{image_id}", status_code=204)
def admin_delete_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not svc.delete_image(image_id):
        raise HTTPException(status_code=404, detail="Image not found.")


# ── Product datasheet upload ───────────────────────────────────────────────────

@router.post("/products/{product_id}/datasheets", status_code=201)
async def admin_upload_datasheet(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    media = MediaService()
    filename, url = await media.save_datasheet(product.part_number, file)
    datasheet = svc.add_datasheet(product, filename, url)
    return {"id": datasheet.id, "filename": datasheet.filename, "url": datasheet.url}


@router.delete("/products/{product_id}/datasheets/{datasheet_id}", status_code=204)
def admin_delete_datasheet(
    product_id: int,
    datasheet_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not svc.delete_datasheet(datasheet_id):
        raise HTTPException(status_code=404, detail="Datasheet not found.")


# ── Brand CRUD ─────────────────────────────────────────────────────────────────

@router.post("/brands", response_model=BrandRead, status_code=201)
def admin_create_brand(
    data: BrandCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    existing = db.query(Brand).filter(Brand.slug == data.slug.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Brand with this slug already exists.")
    brand_data = data.model_dump()
    brand_data["slug"] = brand_data["slug"].lower()
    brand = Brand(**brand_data)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.patch("/brands/{brand_id}", response_model=BrandRead)
def admin_update_brand(
    brand_id: int,
    data: BrandCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(brand, field, value)
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/brands/{brand_id}", status_code=204)
def admin_delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")
    db.delete(brand)
    db.commit()


# ── Category CRUD ──────────────────────────────────────────────────────────────

@router.post("/categories", response_model=CategoryRead, status_code=201)
def admin_create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    existing = db.query(Category).filter(Category.slug == data.slug.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category with this slug already exists.")
    cat_data = data.model_dump()
    cat_data["slug"] = cat_data["slug"].lower()
    cat = Category(**cat_data)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def admin_update_category(
    category_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
def admin_delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(cat)
    db.commit()


# ── Search management ──────────────────────────────────────────────────────────

@router.post("/search/rebuild")
def admin_rebuild_search_index(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    """Rebuild the MeiliSearch index from the database."""
    try:
        index_all_products()
        total = db.query(Product).filter(Product.is_active == True).count()
        return {"status": "ok", "message": f"Indexed {total} products successfully."}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Search rebuild failed: {exc}")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _serialize(p: Product, detail: bool = False) -> dict:
    brand = p.brand_rel
    category = p.category_rel
    images = [img.url for img in p.images] if p.images else []
    result = {
        "id": p.id,
        "part_number": p.part_number,
        "brand": brand.name if brand else None,
        "brand_id": p.brand_id,
        "category": category.name if category else None,
        "category_id": p.category_id,
        "series": p.series,
        "description": p.description,
        "quantity": p.quantity,
        "availability": p.availability,
        "lead_time": p.lead_time,
        "condition": p.condition,
        "is_active": p.is_active,
        "images": images,
        "image": images[0] if images else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }
    if detail:
        result["specifications"] = p.specifications or {}
        result["datasheets"] = [
            {"id": d.id, "filename": d.filename, "url": d.url}
            for d in (p.datasheets or [])
        ]
    return result
