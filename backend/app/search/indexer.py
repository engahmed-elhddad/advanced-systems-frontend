"""Index all products in MeiliSearch."""
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models import Product
from app.search.meilisearch_client import get_search_client


def index_all_products():
    client = get_search_client()
    if not client:
        print("MeiliSearch not available, skipping indexing.")
        return

    db: Session = SessionLocal()
    try:
        products = db.query(Product).filter(Product.is_active == True).all()
        docs = []
        for p in products:
            brand = p.brand_rel
            category = p.category_rel
            images = [img.url for img in p.images]
            docs.append({
                "id": p.id,
                "part_number": p.part_number,
                "brand": brand.name if brand else "",
                "category": category.name if category else "",
                "description": p.description or "",
                "availability": p.availability,
                "image": images[0] if images else "",
            })

        index = client.index("products")
        # Configure filterable attributes
        index.update_filterable_attributes(["brand", "category", "availability"])
        index.update_searchable_attributes(["part_number", "brand", "description", "category"])
        index.update_settings({"typoTolerance": {"enabled": True}})

        if docs:
            index.add_documents(docs)
            print(f"Indexed {len(docs)} products in MeiliSearch.")
        else:
            print("No products to index.")
    finally:
        db.close()


if __name__ == "__main__":
    index_all_products()
