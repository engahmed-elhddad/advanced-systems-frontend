"""MeiliSearch client singleton."""
from typing import Optional
import meilisearch
from app.core.config import settings

_client: Optional[meilisearch.Client] = None


def get_search_client() -> Optional[meilisearch.Client]:
    global _client
    if _client is None:
        try:
            _client = meilisearch.Client(
                settings.MEILISEARCH_URL,
                settings.MEILISEARCH_API_KEY or None,
            )
            _client.health()
        except Exception:
            _client = None
    return _client
