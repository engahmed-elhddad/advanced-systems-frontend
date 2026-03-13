"""Product service — business logic for product CRUD and media management."""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models import Product, Brand, Category, ProductImage, Datasheet
from app.schemas import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    # ── List / filter ──────────────────────────────────────────────────────────

    def list_products(
        self,
        q: Optional[str] = None,
        brand: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        per_page: int = 24,
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).filter(Product.is_active == True)
        if q:
            like = f"%{q}%"
            query = query.filter(
                or_(
                    Product.part_number.ilike(like),
                    Product.description.ilike(like),
                )
            )
        if brand:
            query = query.join(Brand, Product.brand_id == Brand.id).filter(
                Brand.name.ilike(f"%{brand}%")
            )
        if category:
            query = query.join(Category, Product.category_id == Category.id).filter(
                Category.name.ilike(f"%{category}%")
            )
        total = query.count()
        products = query.order_by(Product.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return products, total

    # ── Single lookup ──────────────────────────────────────────────────────────

    def get_by_part_number(self, part_number: str) -> Optional[Product]:
        normalized = part_number.replace(" ", "").upper()
        return (
            self.db.query(Product)
            .filter(func.upper(func.replace(Product.part_number, " ", "")) == normalized)
            .first()
        )

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    # ── CRUD ───────────────────────────────────────────────────────────────────

    def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, data: ProductUpdate) -> Product:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def soft_delete(self, product: Product) -> None:
        product.is_active = False
        self.db.commit()

    # ── Media ──────────────────────────────────────────────────────────────────

    def add_image(self, product: Product, url: str, is_primary: bool = False) -> ProductImage:
        if is_primary:
            for img in product.images:
                img.is_primary = False
        image = ProductImage(
            product_id=product.id,
            url=url,
            is_primary=is_primary,
            sort_order=len(product.images),
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def delete_image(self, image_id: int) -> bool:
        img = self.db.query(ProductImage).filter(ProductImage.id == image_id).first()
        if not img:
            return False
        self.db.delete(img)
        self.db.commit()
        return True

    def add_datasheet(self, product: Product, filename: str, url: str) -> Datasheet:
        ds = Datasheet(product_id=product.id, filename=filename, url=url)
        self.db.add(ds)
        self.db.commit()
        self.db.refresh(ds)
        return ds

    def delete_datasheet(self, datasheet_id: int) -> bool:
        ds = self.db.query(Datasheet).filter(Datasheet.id == datasheet_id).first()
        if not ds:
            return False
        self.db.delete(ds)
        self.db.commit()
        return True

    # ── Related products ───────────────────────────────────────────────────────

    def get_related(self, product: Product, limit: int = 8) -> List[Product]:
        query = self.db.query(Product).filter(
            Product.id != product.id,
            Product.is_active == True,
        )
        if product.category_id:
            query = query.filter(Product.category_id == product.category_id)
        elif product.brand_id:
            query = query.filter(Product.brand_id == product.brand_id)
        return query.limit(limit).all()
