"""
services/db_enrichment.py

Database enrichment service for the Advanced Systems FastAPI backend.

Scans the products table for rows with missing fields and automatically fills
them using pattern analysis and online lookups.

Fields populated:
  - category       : detected from part-number pattern or online lookup
  - description    : scraped from distributor product pages
  - datasheet      : PDF link found via manufacturer / distributor sites
  - manufacturer   : derived from part-number prefix if not set

Usage (from a FastAPI route or management script):

    from services.db_enrichment import enrich_all_products, enrich_product

    # Single product (async context required)
    await enrich_product(db, product)

    # Bulk – run as a background task so the HTTP response is not blocked
    background_tasks.add_task(enrich_all_products, db, Product)

    # Expose via a protected admin endpoint, e.g.:
    #   POST /admin/enrich-products
    #   headers: { "api-key": "ADVANCED_SYSTEMS_ADMIN" }
"""

import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; AdvancedSystemsBot/1.0; "
        "+https://advancedsystems-int.com)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# ---------------------------------------------------------------------------
# Part-number knowledge base
# ---------------------------------------------------------------------------

# Maps well-known part-number prefixes → (manufacturer, category).
# Prefixes are matched case-insensitively against the start of the part number.
_PREFIX_MAP: dict[str, tuple[str, str]] = {
    # Siemens
    "6ES": ("Siemens", "PLC"),
    "6AV": ("Siemens", "HMI"),
    "6SE": ("Siemens", "Drives"),
    "6SL": ("Siemens", "Drives"),
    "6RA": ("Siemens", "Drives"),
    "6EP": ("Siemens", "Power Supply"),
    "3RK": ("Siemens", "Safety Relay"),
    "3TK": ("Siemens", "Safety Relay"),
    "7MH": ("Siemens", "Sensors"),
    # Schneider Electric
    "ATV": ("Schneider Electric", "Drives"),
    "HMIG": ("Schneider Electric", "HMI"),
    "XPSMF": ("Schneider Electric", "Safety Relay"),
    "TM2": ("Schneider Electric", "PLC"),
    "TM3": ("Schneider Electric", "PLC"),
    "TM5": ("Schneider Electric", "PLC"),
    # ABB
    "ACS": ("ABB", "Drives"),
    "ACQ": ("ABB", "Drives"),
    "PSTB": ("ABB", "Soft Starters"),
    "PST": ("ABB", "Soft Starters"),
    "CP6": ("ABB", "HMI"),
    # Omron
    "CP1": ("Omron", "PLC"),
    "CJ1": ("Omron", "PLC"),
    "CJ2": ("Omron", "PLC"),
    "CS1": ("Omron", "PLC"),
    "NX1": ("Omron", "PLC"),
    "NJ5": ("Omron", "PLC"),
    "NJ3": ("Omron", "PLC"),
    "NJ1": ("Omron", "PLC"),
    "E5C": ("Omron", "Sensors"),
    "E5E": ("Omron", "Sensors"),
    "E2E": ("Omron", "Sensors"),
    "NS": ("Omron", "HMI"),
    "NB": ("Omron", "HMI"),
    "3G3": ("Omron", "Drives"),
    # Mitsubishi
    "FX5": ("Mitsubishi", "PLC"),
    "FX3": ("Mitsubishi", "PLC"),
    "FX2": ("Mitsubishi", "PLC"),
    "FX1": ("Mitsubishi", "PLC"),
    "Q06": ("Mitsubishi", "PLC"),
    "Q03": ("Mitsubishi", "PLC"),
    "A1S": ("Mitsubishi", "PLC"),
    "FR-": ("Mitsubishi", "Drives"),
    "MR-": ("Mitsubishi", "Servo"),
    "GT": ("Mitsubishi", "HMI"),
    # SICK
    "CLV": ("SICK", "Sensors"),
    "WTB": ("SICK", "Sensors"),
    "WL1": ("SICK", "Sensors"),
    "IM0": ("SICK", "Sensors"),
    "S300": ("SICK", "Safety Relay"),
    # IFM
    "OG": ("IFM", "Sensors"),
    "IA": ("IFM", "Sensors"),
    "KI": ("IFM", "Sensors"),
    "EF": ("IFM", "Sensors"),
    # Pilz
    "PNOZ": ("Pilz", "Safety Relay"),
    "PMC": ("Pilz", "Servo"),
    # Delta
    "VFD": ("Delta", "Drives"),
    "DVP": ("Delta", "PLC"),
    "DOP": ("Delta", "HMI"),
    "MS3": ("Delta", "Soft Starters"),
    # Balluff
    "BES": ("Balluff", "Sensors"),
    "BNS": ("Balluff", "Sensors"),
    "BTL": ("Balluff", "Sensors"),
}

# Default category used when no pattern or keyword matches.
_DEFAULT_CATEGORY = "industrial automation"

# Keyword → category: scanned in description / part-number text.
_CATEGORY_KEYWORDS: list[tuple[str, str]] = [
    ("plc", "PLC"),
    ("programmable logic", "PLC"),
    ("cpu module", "PLC"),
    ("hmi", "HMI"),
    ("touch panel", "HMI"),
    ("operator panel", "HMI"),
    ("drive", "Drives"),
    ("inverter", "Drives"),
    ("frequency converter", "Drives"),
    ("servo", "Servo"),
    ("sensor", "Sensors"),
    ("proximity", "Sensors"),
    ("photoelectric", "Sensors"),
    ("power supply", "Power Supply"),
    (" psu", "Power Supply"),
    ("safety relay", "Safety Relay"),
    ("soft starter", "Soft Starters"),
]

# ---------------------------------------------------------------------------
# Local (no-network) analysis helpers
# ---------------------------------------------------------------------------


def analyze_part_number(part_number: str) -> dict[str, str]:
    """
    Return a dict with inferred ``manufacturer`` and ``category`` fields
    based on well-known part-number prefix patterns.

    Returns an empty dict when no pattern matches.

    Examples::

        >>> analyze_part_number("6ES7214-1AG40-0XB0")
        {'manufacturer': 'Siemens', 'category': 'PLC'}

        >>> analyze_part_number("ACS550-01-015A-4")
        {'manufacturer': 'ABB', 'category': 'Drives'}
    """
    pn = part_number.strip().upper()
    for prefix, (manufacturer, category) in _PREFIX_MAP.items():
        if pn.startswith(prefix.upper()):
            return {"manufacturer": manufacturer, "category": category}
    return {}


def detect_category(part_number: str, description: str = "") -> str | None:
    """
    Detect the product category from the part number and/or description.

    Returns a category string (e.g. ``"PLC"``) or ``None`` when undetectable.
    """
    # 1. Prefix map (fastest, most reliable)
    inferred = analyze_part_number(part_number)
    if inferred.get("category"):
        return inferred["category"]

    # 2. Keyword scan over combined text
    text = (part_number + " " + description).lower()
    for keyword, category in _CATEGORY_KEYWORDS:
        if keyword in text:
            return category

    return None


def detect_part_info(part_number: str) -> dict[str, str]:
    """
    Return all inferable fields (``manufacturer``, ``category``) for a part
    number using purely local analysis — no network required.
    """
    return analyze_part_number(part_number)


# ---------------------------------------------------------------------------
# Online lookup helpers
# ---------------------------------------------------------------------------


async def _fetch_html(
    url: str, client: httpx.AsyncClient, timeout: float = 10
) -> str | None:
    try:
        resp = await client.get(url, timeout=timeout)
        return resp.text if resp.is_success else None
    except Exception as exc:
        logger.debug("HTTP fetch failed for %s: %s", url, exc)
        return None


def _extract_meta(html: str, name: str) -> str | None:
    """Extract a ``<meta name="..." content="...">`` value from HTML."""
    pattern = (
        rf'<meta[^>]+name=["\']?{re.escape(name)}["\']?[^>]+'
        rf'content=["\']([^"\']+)["\']'
    )
    m = re.search(pattern, html, re.IGNORECASE)
    if m:
        return m.group(1)
    pattern2 = (
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+'
        rf'name=["\']?{re.escape(name)}["\']?'
    )
    m2 = re.search(pattern2, html, re.IGNORECASE)
    return m2.group(1) if m2 else None


def _extract_og(html: str, prop: str) -> str | None:
    """Extract an Open Graph ``<meta property="og:...">`` value from HTML."""
    pattern = (
        rf'<meta[^>]+property=["\']?og:{re.escape(prop)}["\']?[^>]+'
        rf'content=["\']([^"\']+)["\']'
    )
    m = re.search(pattern, html, re.IGNORECASE)
    if m:
        return m.group(1)
    pattern2 = (
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+'
        rf'property=["\']?og:{re.escape(prop)}["\']?'
    )
    m2 = re.search(pattern2, html, re.IGNORECASE)
    return m2.group(1) if m2 else None


async def _get_description_from_rs(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Attempt to fetch a product description from RS Components (UK)."""
    search_url = (
        f"https://uk.rs-online.com/web/c/?searchTerm={part_number}&redirect-action=search"
    )
    html = await _fetch_html(search_url, client)
    if not html:
        return None

    # Follow the first product link
    m = re.search(r'href="(/web/p/[^"?#]+)"', html)
    if m:
        prod_html = await _fetch_html(
            f"https://uk.rs-online.com{m.group(1)}", client
        )
        if prod_html:
            html = prod_html

    desc = _extract_og(html, "description") or _extract_meta(html, "description")
    return desc.strip()[:500] if desc else None


async def _get_description_from_mouser(
    part_number: str, client: httpx.AsyncClient
) -> str | None:
    """Attempt to fetch a product description from Mouser."""
    html = await _fetch_html(
        f"https://www.mouser.com/Search/Refine?Keyword={part_number}", client
    )
    if not html:
        return None

    m = re.search(r'href="(/ProductDetail/[^"?#]+)"', html)
    if m:
        prod_html = await _fetch_html(
            f"https://www.mouser.com{m.group(1)}", client
        )
        if prod_html:
            html = prod_html

    desc = _extract_og(html, "description") or _extract_meta(html, "description")
    return desc.strip()[:500] if desc else None


async def get_datasheet(part_number: str, manufacturer: str = "") -> str | None:
    """
    Attempt to find a publicly accessible datasheet PDF URL for the given
    part number.

    Sources tried in order:
      1. Alldatasheet.com
      2. Mouser direct datasheet link
      3. RS Components datasheet link

    Returns a URL string or ``None`` if no datasheet was found.
    """
    async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True) as client:
        # 1. Alldatasheet
        html = await _fetch_html(
            f"https://www.alldatasheet.com/view.jsp?Searchword={part_number}",
            client,
        )
        if html:
            m = re.search(
                r'href=["\']([^"\']+\.pdf[^"\']*)["\']', html, re.IGNORECASE
            )
            if m:
                url = m.group(1)
                return (
                    url
                    if url.startswith("http")
                    else f"https://www.alldatasheet.com{url}"
                )

        # 2. Mouser datasheet link
        html = await _fetch_html(
            f"https://www.mouser.com/Search/Refine?Keyword={part_number}", client
        )
        if html:
            m = re.search(r'href="(/datasheet/[^"]+\.pdf)"', html, re.IGNORECASE)
            if m:
                return f"https://www.mouser.com{m.group(1)}"

        # 3. RS Components datasheet
        rs_html = await _fetch_html(
            f"https://uk.rs-online.com/web/c/?searchTerm={part_number}&redirect-action=search",
            client,
        )
        if rs_html:
            m_prod = re.search(r'href="(/web/p/[^"?#]+)"', rs_html)
            if m_prod:
                prod_html = await _fetch_html(
                    f"https://uk.rs-online.com{m_prod.group(1)}", client
                )
                if prod_html:
                    m = re.search(
                        r'href=["\']([^"\']+\.pdf[^"\']*)["\']',
                        prod_html,
                        re.IGNORECASE,
                    )
                    if m:
                        url = m.group(1)
                        return (
                            url
                            if url.startswith("http")
                            else f"https://uk.rs-online.com{url}"
                        )

    return None


# ---------------------------------------------------------------------------
# Public enrichment API
# ---------------------------------------------------------------------------


async def enrich_product(db: Any, product: Any) -> bool:
    """
    Fill missing fields (``category``, ``description``, ``datasheet``,
    ``manufacturer``) on a single SQLAlchemy product instance.

    Commits the session and returns ``True`` if any field was updated,
    ``False`` otherwise.
    """
    changed = False
    part = (product.part_number or "").strip()
    if not part:
        return False

    # --- Local analysis (no network) -------------------------------------------
    inferred = analyze_part_number(part)

    if not product.manufacturer and inferred.get("manufacturer"):
        product.manufacturer = inferred["manufacturer"]
        changed = True
        logger.info(
            "[db_enrichment] %s – set manufacturer=%s", part, product.manufacturer
        )

    if not product.category:
        cat = detect_category(part, product.description or "")
        if cat:
            product.category = cat
            changed = True
            logger.info("[db_enrichment] %s – set category=%s", part, product.category)

    # --- Network lookups (only when fields are still missing) ------------------
    needs_description = not (product.description or "").strip()
    needs_datasheet = not (product.datasheet or "").strip()

    if needs_description or needs_datasheet:
        async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True) as client:
            if needs_description:
                desc = await _get_description_from_rs(part, client)
                if not desc:
                    desc = await _get_description_from_mouser(part, client)

                if desc:
                    product.description = desc
                    changed = True
                    logger.info(
                        "[db_enrichment] %s – set description (len=%d)",
                        part,
                        len(desc),
                    )
                else:
                    # Generate a reasonable default description
                    mfr = product.manufacturer or inferred.get("manufacturer", "")
                    cat = product.category or inferred.get(
                        "category", _DEFAULT_CATEGORY
                    )
                    product.description = (
                        f"{part} – {cat} component"
                        f"{' by ' + mfr if mfr else ''}."
                    )
                    changed = True
                    logger.info(
                        "[db_enrichment] %s – set default description", part
                    )

    if needs_datasheet:
        ds_url = await get_datasheet(part, product.manufacturer or "")
        if ds_url:
            product.datasheet = ds_url
            changed = True
            logger.info("[db_enrichment] %s – set datasheet=%s", part, ds_url)

    if changed:
        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error(
                "[db_enrichment] DB commit failed for %s: %s", part, exc
            )
            return False

    return changed


async def enrich_all_products(
    db: Any,
    Product: Any,
    batch_size: int = 20,
) -> dict[str, int]:
    """
    Scan all products in the database and fill any missing fields.

    Only processes rows where at least one target field is ``NULL`` or empty,
    minimising unnecessary network requests.

    Args:
        db:         SQLAlchemy session.
        Product:    SQLAlchemy model class.  Expected columns:
                    ``part_number``, ``manufacturer``, ``category``,
                    ``description``, ``datasheet``.
        batch_size: Number of products processed concurrently per batch.

    Returns:
        ``{"total": N, "enriched": M, "failed": K}``

    Example integration in a FastAPI route::

        @router.post("/admin/enrich-products")
        async def run_enrichment(
            background_tasks: BackgroundTasks,
            db: Session = Depends(get_db),
        ):
            background_tasks.add_task(enrich_all_products, db, Product)
            return {"message": "Enrichment started in background"}
    """
    from sqlalchemy import or_

    products = (
        db.query(Product)
        .filter(
            or_(
                Product.category.is_(None),
                Product.category == "",
                Product.description.is_(None),
                Product.description == "",
                Product.datasheet.is_(None),
                Product.datasheet == "",
                Product.manufacturer.is_(None),
                Product.manufacturer == "",
            )
        )
        .all()
    )

    total = len(products)
    enriched = 0
    failed = 0

    logger.info("[db_enrichment] Starting enrichment of %d product(s)", total)

    # Process products sequentially to avoid concurrent writes on a shared
    # SQLAlchemy session (sessions are not safe for concurrent coroutines).
    # The ``batch_size`` parameter is retained for API compatibility; it now
    # controls logging checkpoint frequency rather than concurrency.
    for i, product in enumerate(products):
        try:
            updated = await enrich_product(db, product)
            if updated:
                enriched += 1
        except Exception as exc:
            failed += 1
            logger.error(
                "[db_enrichment] Enrichment error for %s: %s",
                getattr(product, "part_number", "?"),
                exc,
            )
        if (i + 1) % batch_size == 0:
            logger.info(
                "[db_enrichment] Progress: %d/%d processed", i + 1, total
            )

    logger.info(
        "[db_enrichment] Done. total=%d enriched=%d failed=%d",
        total,
        enriched,
        failed,
    )
    return {"total": total, "enriched": enriched, "failed": failed}
