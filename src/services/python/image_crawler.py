"""
services/image_crawler.py

Automatic product image crawler for the Advanced Systems FastAPI backend.

Architecture: FastAPI (filesystem-based image storage)

Usage (from a FastAPI route or background task):

    from services.image_crawler import crawl_and_save

    # Inside an async route or background task:
    success = await crawl_and_save(part_number="6ES7214-1AG40-0XB0")

Static files must be mounted in main.py:
    from fastapi.staticfiles import StaticFiles
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Images are stored on the filesystem at: uploads/products/{part_number}.jpg
Image URLs returned in API responses will be: /uploads/products/{part_number}.jpg
"""

import logging
import re
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Storage configuration
# ---------------------------------------------------------------------------

UPLOADS_DIR = Path("uploads/products")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

_IMAGE_EXTENSIONS = ("jpg", "jpeg", "png", "webp")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; AdvancedSystemsBot/1.0; "
        "+https://advancedsystems-int.com)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_og_image(html: str) -> str | None:
    """Return the Open Graph image URL from an HTML page, or None."""
    match = re.search(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        html,
    )
    if match:
        return match.group(1)
    # Alternate attribute order
    match = re.search(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        html,
    )
    return match.group(1) if match else None


# ---------------------------------------------------------------------------
# Per-distributor crawlers
# Prefer distributor images (RS, Radwell, Mouser) over generic thumbnails.
# ---------------------------------------------------------------------------


async def _find_image_rs_components(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search RS Components (UK) for a product image."""
    search_url = (
        f"https://uk.rs-online.com/web/c/?searchTerm={part_number}&redirect-action=search"
    )
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        # Attempt to follow the first product link on the search-results page
        product_match = re.search(
            r'href="(/web/p/[^"?#]+)"', html
        )
        if product_match:
            product_url = f"https://uk.rs-online.com{product_match.group(1)}"
            prod_resp = await client.get(product_url, timeout=10)
            if prod_resp.is_success:
                html = prod_resp.text

        # 1. OG image (most reliable)
        img = _extract_og_image(html)
        if img:
            return img

        # 2. RS-specific large product image
        match = re.search(
            r'data-large-image-url=["\']([^"\']+)["\']', html
        )
        if match:
            return match.group(1)

        # 3. Any product image with common RS CDN pattern
        match = re.search(
            r'src=["\']([^"\']*media\.rs-online\.com[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
            html,
        )
        return match.group(1) if match else None
    except Exception as exc:
        logger.debug("RS Components search failed for %s: %s", part_number, exc)
        return None


async def _find_image_radwell(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search Radwell for a product image."""
    search_url = (
        f"https://www.radwell.com/en-US/Buy/search/?search_input={part_number}"
    )
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        # Follow first product link
        product_match = re.search(
            r'href="(/en-US/Buy/[^"?#]+/[^"?#]+/[^"?#]+)"', html
        )
        if product_match:
            product_url = f"https://www.radwell.com{product_match.group(1)}"
            prod_resp = await client.get(product_url, timeout=10)
            if prod_resp.is_success:
                html = prod_resp.text

        img = _extract_og_image(html)
        if img:
            return img

        # Radwell product image attribute
        match = re.search(
            r'src=["\']([^"\']*cloudinary\.com[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
            html,
        )
        return match.group(1) if match else None
    except Exception as exc:
        logger.debug("Radwell search failed for %s: %s", part_number, exc)
        return None


async def _find_image_mouser(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search Mouser for a product image."""
    search_url = f"https://www.mouser.com/Search/Refine?Keyword={part_number}"
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        # Follow the first product detail link
        product_match = re.search(
            r'href="(/ProductDetail/[^"?#]+)"', html
        )
        if product_match:
            product_url = f"https://www.mouser.com{product_match.group(1)}"
            prod_resp = await client.get(product_url, timeout=10)
            if prod_resp.is_success:
                html = prod_resp.text

        img = _extract_og_image(html)
        if img:
            return img

        # Mouser product image
        match = re.search(
            r'class=["\'][^"\']*product-image[^"\']*["\'][^>]*src=["\']([^"\']+)["\']',
            html,
        )
        if match:
            url = match.group(1)
            return url if url.startswith("http") else f"https://www.mouser.com{url}"

        return None
    except Exception as exc:
        logger.debug("Mouser search failed for %s: %s", part_number, exc)
        return None


async def _find_image_electech(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Search electech.com.eg (WooCommerce) for a product image."""
    search_url = (
        f"https://www.electech.com.eg/?s={part_number}&post_type=product"
    )
    try:
        resp = await client.get(search_url, timeout=10)
        if not resp.is_success:
            return None
        html = resp.text

        product_match = re.search(
            r'href="(https://www\.electech\.com\.eg/product/[^"]+)"', html
        )
        if product_match:
            prod_resp = await client.get(product_match.group(1), timeout=10)
            if prod_resp.is_success:
                html = prod_resp.text

        # WooCommerce gallery image
        wc_match = re.search(
            r'class=["\'][^"\']*woocommerce-product-gallery__image[^"\']*["\'][^>]*>'
            r'\s*<a[^>]*href=["\']([^"\']+)["\']',
            html,
        )
        if wc_match:
            return wc_match.group(1)

        img = _extract_og_image(html)
        if img:
            return img

        # wp-post-image fallback
        match = re.search(
            r'class=["\'][^"\']*wp-post-image[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
            html,
        )
        return match.group(1) if match else None
    except Exception as exc:
        logger.debug("Electech search failed for %s: %s", part_number, exc)
        return None


# ---------------------------------------------------------------------------
# Download helper
# ---------------------------------------------------------------------------


async def _download_image(
    image_url: str, client: httpx.AsyncClient
) -> tuple[bytes, str] | None:
    """Download an image and return (bytes, content_type), or None on failure."""
    try:
        resp = await client.get(image_url, timeout=15)
        if not resp.is_success:
            return None
        content_type = resp.headers.get("content-type", "image/jpeg")
        return resp.content, content_type
    except Exception as exc:
        logger.debug("Image download failed from %s: %s", image_url, exc)
        return None


# ---------------------------------------------------------------------------
# Image file lookup helper
# ---------------------------------------------------------------------------


def find_local_image(part_number: str) -> str | None:
    """
    Search ``uploads/products/`` for an existing image that matches the given
    part number.

    The lookup is intentionally fuzzy to cope with files whose names differ
    from the stored part number due to:
      - Hyphens vs. no-hyphens  (``6ES7214-1AG40`` vs. ``6ES72141AG40``)
      - Underscores             (``6ES7214_1AG40`` vs. ``6ES7214-1AG40``)
      - Extra suffixes          (``6ES7214-1AG40_1.jpg``)
      - Case differences        (``6es7214-1ag40.jpg``)

    Matching strategy (tried in order):
      1. **Exact (case-insensitive)**: ``{PART_NUMBER}.{ext}``
      2. **No-hyphens**: ``{PART_WITHOUT_HYPHENS}.{ext}``
      3. **No-underscores**: ``{PART_WITHOUT_UNDERSCORES}.{ext}``
      4. **Alphanumeric-only**: ``{PART_ALPHANUM_ONLY}.{ext}``
      5. **Prefix match**: any file whose alphanumeric stem *starts with*
         the alphanumeric-only part number (handles extra suffixes).

    Returns a URL-style relative path ``/uploads/products/{filename}`` on
    success, or ``None`` when no match is found.

    This function is intended to replace the fragile
    ``normalized_part = p.part_number.replace("-", "").upper()`` lookup
    used in the FastAPI backend::

        # In your product API endpoint (FastAPI backend):
        from services.image_crawler import find_local_image

        image_path = find_local_image(product.part_number)
        if image_path:
            response["images"] = [image_path]
    """
    if not UPLOADS_DIR.exists():
        return None

    pn_upper = part_number.strip().upper()

    # Build the set of normalised variants to compare against file stems.
    pn_no_hyphen = pn_upper.replace("-", "")
    pn_no_underscore = pn_upper.replace("_", "")
    pn_alphanum = re.sub(r"[^A-Z0-9]", "", pn_upper)

    candidates = {pn_upper, pn_no_hyphen, pn_no_underscore, pn_alphanum}

    # Collect all image files once to avoid redundant directory reads.
    image_files = [
        f
        for f in UPLOADS_DIR.iterdir()
        if f.is_file() and f.suffix.lower().lstrip(".") in _IMAGE_EXTENSIONS
    ]

    # Pass 1: exact stem match (case-insensitive)
    for img_file in image_files:
        if img_file.stem.upper() in candidates:
            return f"/uploads/products/{img_file.name}"

    # Pass 2: prefix / extra-suffix match
    # A stored file like ``6ES7214-1AG40-0XB0_1.jpg`` should match the part
    # number ``6ES7214-1AG40-0XB0``.
    # Pre-compute alphanum variants of the candidate set once.
    cand_alphanum_set = {
        (c, re.sub(r"[^A-Z0-9]", "", c)) for c in candidates if c
    }
    for img_file in image_files:
        stem_alphanum = re.sub(r"[^A-Z0-9]", "", img_file.stem.upper())
        for _cand, cand_alphanum in cand_alphanum_set:
            if cand_alphanum and stem_alphanum.startswith(cand_alphanum):
                return f"/uploads/products/{img_file.name}"

    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def crawl_product_image(part_number: str) -> str | None:
    """
    Crawl distributor sites to find and download a product image.

    Sources are tried in priority order:
      1. RS Components  (preferred – high-quality distributor images)
      2. Radwell        (preferred – distributor)
      3. Mouser         (preferred – distributor)
      4. Electech       (local distributor fallback)

    On success, saves the file to ``uploads/products/{PART_NUMBER}.jpg``
    and returns the relative path ``products/{PART_NUMBER}.jpg``.

    Returns ``None`` if no image was found.
    """
    part_upper = part_number.strip().upper()

    finders = [
        ("rs_components", _find_image_rs_components),
        ("radwell", _find_image_radwell),
        ("mouser", _find_image_mouser),
        ("electech", _find_image_electech),
    ]

    async with httpx.AsyncClient(
        headers=_HEADERS, follow_redirects=True
    ) as client:
        image_url: str | None = None
        source: str = "unknown"

        for source_name, finder in finders:
            image_url = await finder(part_upper, client)
            if image_url:
                source = source_name
                break

        if not image_url:
            logger.warning(
                "[image_crawler] No image found for part: %s", part_upper
            )
            return None

        downloaded = await _download_image(image_url, client)
        if not downloaded:
            logger.warning(
                "[image_crawler] Failed to download image for %s from %s",
                part_upper,
                image_url,
            )
            return None

        raw_bytes, content_type = downloaded

    # Determine file extension
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    else:
        ext = "jpg"
    dest_path = UPLOADS_DIR / f"{part_upper}.{ext}"
    dest_path.write_bytes(raw_bytes)

    relative_path = f"products/{part_upper}.{ext}"
    logger.info(
        "[image_crawler] Image saved for %s (source: %s) → %s",
        part_upper,
        source,
        dest_path,
    )
    return relative_path


async def crawl_and_save(part_number: str) -> bool:
    """
    Full pipeline: crawl image → save file to filesystem.

    Images are stored at: uploads/products/{part_number}.jpg

    Integrate this into FastAPI endpoints as a background task:

        background_tasks.add_task(crawl_and_save, part_number=product.part_number)

    Returns ``True`` on success, ``False`` if no image was found.
    """
    relative_path = await crawl_product_image(part_number)
    if not relative_path:
        logger.warning(
            "[image_crawler] crawl_and_save: no image found for %s",
            part_number,
        )
        return False

    logger.info(
        "[image_crawler] Image saved to filesystem: %s",
        relative_path,
    )
    return True
