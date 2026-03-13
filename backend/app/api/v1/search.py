"""MeiliSearch-powered search router."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.search.meilisearch_client import get_search_client

router = APIRouter()


@router.get("/search")
def search_products(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=100),
):
    client = get_search_client()
    if not client:
        raise HTTPException(status_code=503, detail="Search service unavailable")

    index = client.index("products")
    filters = []
    if category:
        filters.append(f'category = "{category}"')
    if brand:
        filters.append(f'brand = "{brand}"')

    result = index.search(
        q,
        {
            "limit": per_page,
            "offset": (page - 1) * per_page,
            "filter": " AND ".join(filters) if filters else None,
            "attributesToHighlight": ["part_number", "description"],
        },
    )

    return {
        "hits": result["hits"],
        "total": result.get("estimatedTotalHits", 0),
        "page": page,
        "per_page": per_page,
    }


@router.get("/search/suggest")
def suggest(q: str = Query(..., min_length=1)):
    """Return autocomplete suggestions for part numbers."""
    client = get_search_client()
    if not client:
        return {"suggestions": []}
    index = client.index("products")
    result = index.search(q, {"limit": 8, "attributesToRetrieve": ["part_number", "brand"]})
    return {"suggestions": [h["part_number"] for h in result.get("hits", [])]}
