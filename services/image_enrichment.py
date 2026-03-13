"""
services/image_enrichment.py

Automatic product image enrichment for the Advanced Systems FastAPI backend.

This service checks whether a product is missing an image and, if so, searches
multiple online sources to find one, downloads it, saves it to disk and updates
the database record.

Sources tried in priority order
--------------------------------
1. RS Components       (uk.rs-online.com)
2. Radwell             (radwell.com)
3. Mouser              (mouser.com)
4. Electech            (electech.com.eg)
5. Octopart            (octopart.com)
6. Bing Image Search   (www.bing.com/images)

Architecture: FastAPI + SQLAlchemy

Usage (from a FastAPI route or background task)
-----------------------------------------------

    from services.image_enrichment import enrich_product_image, enrich_all_products

    # Enrich a single product:
    success = await enrich_product_image(
        part_number="6ES7214-1AG40-0XB0",
        product=product_orm_instance,     # Must expose a writable .image attribute
        db=db,
    )

    # Enrich all products that are missing images:
    stats = await enrich_all_products(db=db, Product=Product)

Static files must be mounted in main.py:
    from fastapi.staticfiles import StaticFiles
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

After enrichment the stored image path will be:
    product.image = "{PART_NUMBER}.jpg"       (filename only)
which maps to the URL:
    /uploads/products/{PART_NUMBER}.jpg
"""

import logging
import re
from pathlib import Path

import httpx

# Re-use low-level helpers already written in image_crawler.py
from services.image_crawler import (
    _HEADERS,
    _download_image,
    _extract_og_image,
    _find_image_electech,
    _find_image_mouser,
    _find_image_radwell,
    _find_image_rs_components,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Storage configuration
# ---------------------------------------------------------------------------

UPLOADS_DIR = Path("uploads/products")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Additional image sources
# ---------------------------------------------------------------------------


async def _find_image_octopart(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search Octopart for a product image."""
    search_url = f"https://octopart.com/search?q={part_number}&currency=USD&specs=0"
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        # Try to follow first product link
        product_match = re.search(
            r'href="(https://octopart\.com/[^"?#]+-\d+)"', html
        )
        if product_match:
            prod_resp = await client.get(product_match.group(1), timeout=10)
            if prod_resp.is_success:
                html = prod_resp.text

        # OG image (most reliable)
        img = _extract_og_image(html)
        if img and not img.endswith("octopart-default"):
            return img

        # Octopart CDN image pattern
        match = re.search(
            r'src=["\']([^"\']*octopart[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
            html,
        )
        if match:
            return match.group(1)

        # Component image from Octopart's img tags
        match = re.search(
            r'<img[^>]+alt=["\'][^"\']*'
            + re.escape(part_number[:8])
            + r'[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        return match.group(1) if match else None
    except Exception as exc:
        logger.debug("Octopart search failed for %s: %s", part_number, exc)
        return None


async def _find_image_bing(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search Bing Images for a product image."""
    query = f"{part_number} industrial product"
    search_url = f"https://www.bing.com/images/search?q={query}&first=1"
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        # Extract image URLs from Bing image results (murl parameter)
        match = re.search(r'"murl":"([^"]+\.(?:jpg|jpeg|png|webp))"', html)
        if match:
            return match.group(1)

        # Fallback: look for imgurl parameter
        match = re.search(r'imgurl=([^&"\']+\.(?:jpg|jpeg|png|webp))', html)
        if match:
            url = match.group(1)
            # URL-decode the value
            url = url.replace("%3A", ":").replace("%2F", "/")
            if url.startswith("http"):
                return url

        return None
    except Exception as exc:
        logger.debug("Bing image search failed for %s: %s", part_number, exc)
        return None


# ---------------------------------------------------------------------------
# Core enrichment helpers
# ---------------------------------------------------------------------------


def _is_image_missing(product) -> bool:
    """
    Return True when the product is missing a usable image.

    Handles both ORM objects (``product.image``, ``product.images``) and plain
    dicts (``product["image"]``, ``product["images"]``).
    """
    # dict-style access
    if isinstance(product, dict):
        img = product.get("image") or ""
        images = product.get("images") or []
    else:
        # ORM / dataclass attribute access
        img = getattr(product, "image", None) or ""
        images = getattr(product, "images", None) or []

    if img.strip():
        return False
    if images:
        first = images[0] if isinstance(images, (list, tuple)) else images
        if isinstance(first, str) and first.strip():
            return False
    return True


async def _find_image(part_number: str, client: httpx.AsyncClient) -> str | None:
    """
    Try all configured sources in priority order and return the first image URL
    found, or ``None`` if all sources fail.
    """
    finders = [
        ("rs_components", _find_image_rs_components),
        ("radwell", _find_image_radwell),
        ("mouser", _find_image_mouser),
        ("electech", _find_image_electech),
        ("octopart", _find_image_octopart),
        ("bing", _find_image_bing),
    ]

    for source_name, finder in finders:
        try:
            image_url = await finder(part_number, client)
            if image_url:
                logger.debug(
                    "[image_enrichment] Found image for %s via %s: %s",
                    part_number,
                    source_name,
                    image_url,
                )
                return image_url
        except Exception as exc:
            logger.debug(
                "[image_enrichment] Source %s failed for %s: %s",
                source_name,
                part_number,
                exc,
            )

    return None


def _save_image_bytes(part_number: str, raw_bytes: bytes, content_type: str) -> str:
    """
    Write image bytes to ``uploads/products/{PART_NUMBER}.{ext}`` and return
    just the filename (e.g. ``"6ES7214-1AG40-0XB0.jpg"``).
    """
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    else:
        ext = "jpg"

    filename = f"{part_number}.{ext}"
    dest_path = UPLOADS_DIR / filename
    dest_path.write_bytes(raw_bytes)
    logger.info("[image_enrichment] Image saved → %s", dest_path)
    return filename


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def enrich_product_image(
    part_number: str,
    product,  # SQLAlchemy ORM instance **or** plain dict with an 'image' key
    db=None,  # sqlalchemy.orm.Session (optional; commit is skipped when None)
) -> bool:
    """
    Enrich a single product with an image if it is currently missing one.

    Steps
    -----
    1. Return immediately (``True``) when the product already has an image.
    2. Search all configured sources for a matching product image.
    3. Download the image and save it to ``uploads/products/{PART_NUMBER}.jpg``.
    4. Update ``product.image = "{PART_NUMBER}.jpg"`` and commit when *db* is
       provided.

    Returns
    -------
    ``True``  – image was already present **or** was successfully found and saved.
    ``False`` – no image could be found after exhausting all sources.
    """
    part_upper = part_number.strip().upper()

    if not _is_image_missing(product):
        logger.debug(
            "[image_enrichment] Skipping %s – image already present.", part_upper
        )
        return True

    async with httpx.AsyncClient(
        headers=_HEADERS, follow_redirects=True
    ) as client:
        image_url = await _find_image(part_upper, client)

        if not image_url:
            logger.warning(
                "[image_enrichment] No image found for %s after trying all sources.",
                part_upper,
            )
            return False

        downloaded = await _download_image(image_url, client)
        if not downloaded:
            logger.warning(
                "[image_enrichment] Failed to download image for %s from %s",
                part_upper,
                image_url,
            )
            return False

        raw_bytes, content_type = downloaded

    filename = _save_image_bytes(part_upper, raw_bytes, content_type)

    # Persist to product record
    if isinstance(product, dict):
        product["image"] = filename
    else:
        product.image = filename

    if db is not None:
        try:
            db.commit()
            logger.info(
                "[image_enrichment] DB updated: product %s → image=%s",
                part_upper,
                filename,
            )
        except Exception as exc:
            db.rollback()
            logger.error(
                "[image_enrichment] DB commit failed for %s: %s", part_upper, exc
            )
            return False

    return True


async def enrich_all_products(
    db,        # sqlalchemy.orm.Session
    Product,   # SQLAlchemy model class with .part_number and .image attributes
    limit: int | None = None,
) -> dict:
    """
    Iterate over all products that are missing images and enrich them.

    Parameters
    ----------
    db : sqlalchemy.orm.Session
    Product : SQLAlchemy model class
        Must expose ``.part_number`` and ``.image`` columns.
    limit : int | None
        When set, process at most *limit* products per call (useful for
        background tasks that should not block the event loop for too long).

    Returns
    -------
    dict
        ``{ "total": int, "enriched": int, "skipped": int, "failed": int }``

    Example FastAPI integration
    ---------------------------

        from services.image_enrichment import enrich_all_products

        @router.post("/admin/enrich-images")
        async def enrich_images_endpoint(
            background_tasks: BackgroundTasks,
            db: Session = Depends(get_db),
        ):
            background_tasks.add_task(enrich_all_products, db=db, Product=Product)
            return {"message": "Image enrichment started in background."}
    """
    query = db.query(Product).filter(
        Product.image.is_(None) | (Product.image == "")
    )
    if limit is not None:
        query = query.limit(limit)

    products = query.all()

    total = len(products)
    enriched = 0
    skipped = 0
    failed = 0

    logger.info(
        "[image_enrichment] Starting bulk enrichment for %d products.", total
    )

    for product in products:
        part_number = getattr(product, "part_number", None)
        if not part_number:
            skipped += 1
            continue

        # If the product already has an image (e.g. via product.images array)
        # count it as skipped rather than enriched.
        if not _is_image_missing(product):
            skipped += 1
            continue

        success = await enrich_product_image(
            part_number=part_number,
            product=product,
            db=db,
        )
        if success:
            enriched += 1
        else:
            failed += 1

    logger.info(
        "[image_enrichment] Bulk enrichment complete: "
        "total=%d enriched=%d skipped=%d failed=%d",
        total,
        enriched,
        skipped,
        failed,
    )

    return {
        "total": total,
        "enriched": enriched,
        "skipped": skipped,
        "failed": failed,
    }
