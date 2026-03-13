"""Search service — wraps MeiliSearch operations."""
from typing import Optional, List, Dict, Any

from app.search.meilisearch_client import get_search_client


class SearchService:
    INDEX_NAME = "products"

    def search(
        self,
        q: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        page: int = 1,
        per_page: int = 24,
    ) -> Dict[str, Any]:
        client = get_search_client()
        if not client:
            return {"hits": [], "total": 0, "page": page, "per_page": per_page}

        filters: List[str] = []
        if category:
            filters.append(f'category = "{category}"')
        if brand:
            filters.append(f'brand = "{brand}"')

        index = client.index(self.INDEX_NAME)
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
            "hits": result.get("hits", []),
            "total": result.get("estimatedTotalHits", 0),
            "page": page,
            "per_page": per_page,
        }

    def suggest(self, q: str, limit: int = 8) -> List[str]:
        client = get_search_client()
        if not client:
            return []
        index = client.index(self.INDEX_NAME)
        result = index.search(q, {"limit": limit, "attributesToRetrieve": ["part_number", "brand"]})
        return [h["part_number"] for h in result.get("hits", [])]

    def rebuild_index(self, products: List[Dict[str, Any]]) -> int:
        """Re-index all products. Returns number of documents indexed."""
        client = get_search_client()
        if not client:
            raise RuntimeError("MeiliSearch is not available.")

        index = client.index(self.INDEX_NAME)
        index.update_filterable_attributes(["brand", "category", "availability"])
        index.update_searchable_attributes(["part_number", "brand", "description", "category"])
        index.update_settings({"typoTolerance": {"enabled": True}})

        if products:
            index.add_documents(products)
        return len(products)
