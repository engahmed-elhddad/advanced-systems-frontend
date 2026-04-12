"""
services/part_number_intelligence.py

Industrial Part Number Intelligence Engine for the Advanced Systems backend.

Automatically detects brand, series, and category from industrial part numbers
by matching against a built-in pattern rules database.

Usage (from a FastAPI route)::

    from services.part_number_intelligence import detect_part_number_info

    result = detect_part_number_info("6ES7315-2EH14-0AB0")
    # → {"brand": "Siemens", "series": "S7-300", "category": "PLC CPU",
    #     "normalized": "6ES7315-2EH14-0AB0", "matched_prefix": "6ES7"}

Expose via an optional endpoint::

    GET /intelligence/{part_number}

This service is intentionally database-free: the pattern rules live in the
``PATTERN_RULES`` list below, which mirrors the ``part_number_patterns`` table
described in the issue.  Rules are sorted by prefix length (longest first) so
that more specific prefixes (e.g. ``6ES7``) always win over shorter ones.

Extending
---------
Add a new ``PatternRule`` entry to ``PATTERN_RULES`` — no code changes needed
elsewhere.  To persist rules in a real database, replace ``_build_sorted_rules``
with a DB query that materialises the same structure.
"""

from __future__ import annotations

import functools
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data model (mirrors the part_number_patterns DB table)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class PatternRule:
    """A single entry in the ``part_number_patterns`` table."""

    brand: str
    pattern_prefix: str
    series: str
    category: str
    priority: int = 0


# ---------------------------------------------------------------------------
# Pattern rules database
# ---------------------------------------------------------------------------
# Fields: brand | pattern_prefix | series | category | priority
# Priority is only used when two prefixes have the same length.
# Add new brands / patterns here without changing any other code.

PATTERN_RULES: list[PatternRule] = [
    # ------------------------------------------------------------------
    # Siemens
    # ------------------------------------------------------------------
    PatternRule("Siemens", "6ES7", "S7-300/400", "PLC CPU"),
    PatternRule("Siemens", "6ES5", "S5", "PLC"),
    PatternRule("Siemens", "6AV6", "SIMATIC HMI", "HMI"),
    PatternRule("Siemens", "6AV2", "SIMATIC HMI", "HMI"),
    PatternRule("Siemens", "6AV3", "SIMATIC HMI", "HMI"),
    PatternRule("Siemens", "6GK7", "SIMATIC NET", "Communication Processor"),
    PatternRule("Siemens", "6GK5", "SCALANCE", "Network Switch"),
    PatternRule("Siemens", "6SE7", "SIMOVERT", "Drives"),
    PatternRule("Siemens", "6SL3", "SINAMICS", "Drives"),
    PatternRule("Siemens", "6SE6", "MICROMASTER", "Drives"),
    PatternRule("Siemens", "6RA8", "SINAMICS DC", "Drives"),
    PatternRule("Siemens", "6EP1", "SITOP", "Power Supply"),
    PatternRule("Siemens", "6EP3", "SITOP", "Power Supply"),
    PatternRule("Siemens", "3RT2", "SIRIUS", "Contactor"),
    PatternRule("Siemens", "3RT1", "SIRIUS", "Contactor"),
    PatternRule("Siemens", "3RU2", "SIRIUS", "Overload Relay"),
    PatternRule("Siemens", "3RU1", "SIRIUS", "Overload Relay"),
    PatternRule("Siemens", "3RK", "SIRIUS", "Safety Relay"),
    PatternRule("Siemens", "3TK", "SIRIUS", "Safety Relay"),
    PatternRule("Siemens", "7MH", "SIWAREX", "Sensors"),
    PatternRule("Siemens", "6ES", "S7", "PLC"),
    PatternRule("Siemens", "6AV", "SIMATIC HMI", "HMI"),
    PatternRule("Siemens", "6SE", "SINAMICS", "Drives"),
    PatternRule("Siemens", "6SL", "SINAMICS", "Drives"),
    PatternRule("Siemens", "6RA", "SINAMICS DC", "Drives"),
    PatternRule("Siemens", "6EP", "SITOP", "Power Supply"),
    PatternRule("Siemens", "3RT", "SIRIUS", "Contactor"),
    PatternRule("Siemens", "3RU", "SIRIUS", "Overload Relay"),
    # ------------------------------------------------------------------
    # Schneider Electric
    # ------------------------------------------------------------------
    PatternRule("Schneider Electric", "LC1D", "TeSys D", "Contactor"),
    PatternRule("Schneider Electric", "LC1F", "TeSys F", "Contactor"),
    PatternRule("Schneider Electric", "LC1K", "TeSys K", "Contactor"),
    PatternRule("Schneider Electric", "LR2D", "TeSys D", "Overload Relay"),
    PatternRule("Schneider Electric", "LR9F", "TeSys F", "Overload Relay"),
    PatternRule("Schneider Electric", "ATV71", "Altivar 71", "Drives"),
    PatternRule("Schneider Electric", "ATV61", "Altivar 61", "Drives"),
    PatternRule("Schneider Electric", "ATV32", "Altivar 32", "Drives"),
    PatternRule("Schneider Electric", "ATV31", "Altivar 31", "Drives"),
    PatternRule("Schneider Electric", "ATV12", "Altivar 12", "Drives"),
    PatternRule("Schneider Electric", "ATV", "Altivar", "Drives"),
    PatternRule("Schneider Electric", "HMIG", "Magelis", "HMI"),
    PatternRule("Schneider Electric", "HMIGU", "Magelis", "HMI"),
    PatternRule("Schneider Electric", "XPSMF", "Preventa", "Safety Relay"),
    PatternRule("Schneider Electric", "TM241", "Modicon M241", "PLC"),
    PatternRule("Schneider Electric", "TM251", "Modicon M251", "PLC"),
    PatternRule("Schneider Electric", "TM221", "Modicon M221", "PLC"),
    PatternRule("Schneider Electric", "TM5", "Modicon M580", "PLC"),
    PatternRule("Schneider Electric", "TM3", "Modicon M340", "PLC"),
    PatternRule("Schneider Electric", "TM2", "Modicon M2xx", "PLC"),
    PatternRule("Schneider Electric", "ZB", "Harmony", "Pushbutton"),
    PatternRule("Schneider Electric", "XB4", "Harmony", "Pushbutton"),
    PatternRule("Schneider Electric", "XB5", "Harmony", "Pushbutton"),
    # ------------------------------------------------------------------
    # ABB
    # ------------------------------------------------------------------
    PatternRule("ABB", "ACS880", "ACS880", "Drives"),
    PatternRule("ABB", "ACS580", "ACS580", "Drives"),
    PatternRule("ABB", "ACS550", "ACS550", "Drives"),
    PatternRule("ABB", "ACS355", "ACS355", "Drives"),
    PatternRule("ABB", "ACS310", "ACS310", "Drives"),
    PatternRule("ABB", "ACQ810", "ACQ810", "Drives"),
    PatternRule("ABB", "ACS", "ACS", "Drives"),
    PatternRule("ABB", "PSTB", "PST", "Soft Starters"),
    PatternRule("ABB", "PSR", "PSR", "Soft Starters"),
    PatternRule("ABB", "PST", "PST", "Soft Starters"),
    PatternRule("ABB", "CP6", "CP600", "HMI"),
    PatternRule("ABB", "CP62", "CP600", "HMI"),
    PatternRule("ABB", "AF", "AF-Series", "Contactor"),
    # ------------------------------------------------------------------
    # Omron
    # ------------------------------------------------------------------
    PatternRule("Omron", "NX701", "NX7", "PLC CPU"),
    PatternRule("Omron", "NX102", "NX1", "PLC CPU"),
    PatternRule("Omron", "NJ501", "NJ5", "PLC CPU"),
    PatternRule("Omron", "NJ301", "NJ3", "PLC CPU"),
    PatternRule("Omron", "NJ101", "NJ1", "PLC CPU"),
    PatternRule("Omron", "CJ2M", "CJ2", "PLC CPU"),
    PatternRule("Omron", "CJ2H", "CJ2", "PLC CPU"),
    PatternRule("Omron", "CJ1M", "CJ1", "PLC CPU"),
    PatternRule("Omron", "CJ1H", "CJ1", "PLC CPU"),
    PatternRule("Omron", "CP1L", "CP1L", "PLC CPU"),
    PatternRule("Omron", "CP1H", "CP1H", "PLC CPU"),
    PatternRule("Omron", "CP1E", "CP1E", "PLC CPU"),
    PatternRule("Omron", "CS1D", "CS1", "PLC CPU"),
    PatternRule("Omron", "CS1H", "CS1", "PLC CPU"),
    PatternRule("Omron", "NX1", "NX1", "PLC"),
    PatternRule("Omron", "NJ5", "NJ5", "PLC"),
    PatternRule("Omron", "NJ3", "NJ3", "PLC"),
    PatternRule("Omron", "NJ1", "NJ1", "PLC"),
    PatternRule("Omron", "CJ2", "CJ2", "PLC"),
    PatternRule("Omron", "CJ1", "CJ1", "PLC"),
    PatternRule("Omron", "CS1", "CS1", "PLC"),
    PatternRule("Omron", "CP1", "CP1", "PLC"),
    PatternRule("Omron", "E2E", "E2E", "Proximity Sensor"),
    PatternRule("Omron", "E2B", "E2B", "Proximity Sensor"),
    PatternRule("Omron", "E2C", "E2C", "Proximity Sensor"),
    PatternRule("Omron", "E3F", "E3F", "Photoelectric Sensor"),
    PatternRule("Omron", "E3Z", "E3Z", "Photoelectric Sensor"),
    PatternRule("Omron", "E5C", "E5C", "Temperature Controller"),
    PatternRule("Omron", "E5E", "E5E", "Temperature Controller"),
    PatternRule("Omron", "NS10", "NS", "HMI"),
    PatternRule("Omron", "NS12", "NS", "HMI"),
    PatternRule("Omron", "NS5", "NS", "HMI"),
    PatternRule("Omron", "NB7", "NB", "HMI"),
    PatternRule("Omron", "NB5", "NB", "HMI"),
    PatternRule("Omron", "NS", "NS", "HMI"),
    PatternRule("Omron", "NB", "NB", "HMI"),
    PatternRule("Omron", "3G3MX", "MX2", "Drives"),
    PatternRule("Omron", "3G3", "3G3", "Drives"),
    # ------------------------------------------------------------------
    # Mitsubishi
    # ------------------------------------------------------------------
    PatternRule("Mitsubishi", "FX5U", "FX5U", "PLC CPU"),
    PatternRule("Mitsubishi", "FX5UJ", "FX5UJ", "PLC CPU"),
    PatternRule("Mitsubishi", "FX3U", "FX3U", "PLC CPU"),
    PatternRule("Mitsubishi", "FX3G", "FX3G", "PLC CPU"),
    PatternRule("Mitsubishi", "FX2N", "FX2N", "PLC CPU"),
    PatternRule("Mitsubishi", "FX1N", "FX1N", "PLC CPU"),
    PatternRule("Mitsubishi", "FX5", "FX5", "PLC"),
    PatternRule("Mitsubishi", "FX3", "FX3", "PLC"),
    PatternRule("Mitsubishi", "FX2", "FX2", "PLC"),
    PatternRule("Mitsubishi", "FX1", "FX1", "PLC"),
    PatternRule("Mitsubishi", "Q06", "Q-Series", "PLC CPU"),
    PatternRule("Mitsubishi", "Q03", "Q-Series", "PLC CPU"),
    PatternRule("Mitsubishi", "A1S", "A-Series", "PLC"),
    PatternRule("Mitsubishi", "FR-A8", "FR-A800", "Drives"),
    PatternRule("Mitsubishi", "FR-F8", "FR-F800", "Drives"),
    PatternRule("Mitsubishi", "FR-E8", "FR-E800", "Drives"),
    PatternRule("Mitsubishi", "FR-D7", "FR-D700", "Drives"),
    PatternRule("Mitsubishi", "FR-", "FR-Series", "Drives"),
    PatternRule("Mitsubishi", "MR-J5", "MR-J5", "Servo"),
    PatternRule("Mitsubishi", "MR-J4", "MR-J4", "Servo"),
    PatternRule("Mitsubishi", "MR-", "MR-Series", "Servo"),
    PatternRule("Mitsubishi", "GT27", "GOT2000", "HMI"),
    PatternRule("Mitsubishi", "GT25", "GOT2000", "HMI"),
    PatternRule("Mitsubishi", "GT21", "GOT2000", "HMI"),
    PatternRule("Mitsubishi", "GT", "GOT", "HMI"),
    # ------------------------------------------------------------------
    # SICK
    # ------------------------------------------------------------------
    PatternRule("SICK", "CLV6", "CLV600", "Barcode Scanner"),
    PatternRule("SICK", "CLV5", "CLV500", "Barcode Scanner"),
    PatternRule("SICK", "CLV", "CLV", "Barcode Scanner"),
    PatternRule("SICK", "WTB4", "WTB4", "Photoelectric Sensor"),
    PatternRule("SICK", "WTB", "WTB", "Photoelectric Sensor"),
    PatternRule("SICK", "WL12", "W12", "Photoelectric Sensor"),
    PatternRule("SICK", "WL1", "WL100", "Photoelectric Sensor"),
    PatternRule("SICK", "IM08", "IM", "Inductive Sensor"),
    PatternRule("SICK", "IM0", "IM", "Inductive Sensor"),
    PatternRule("SICK", "S300", "S300", "Safety Relay"),
    PatternRule("SICK", "S3000", "S3000", "Safety Scanner"),
    PatternRule("SICK", "TIM5", "TiM5xx", "LiDAR"),
    PatternRule("SICK", "LMS2", "LMS200", "LiDAR"),
    # ------------------------------------------------------------------
    # IFM
    # ------------------------------------------------------------------
    PatternRule("IFM", "OGH", "OG", "Photoelectric Sensor"),
    PatternRule("IFM", "OG", "OG", "Photoelectric Sensor"),
    PatternRule("IFM", "IA", "IA", "Inductive Sensor"),
    PatternRule("IFM", "IFB", "IFB", "Inductive Sensor"),
    PatternRule("IFM", "KI8", "KI", "Capacitive Sensor"),
    PatternRule("IFM", "KI", "KI", "Capacitive Sensor"),
    PatternRule("IFM", "EF", "EF", "Flow Sensor"),
    PatternRule("IFM", "SA", "SA", "Flow Sensor"),
    PatternRule("IFM", "PN7", "PN7", "Pressure Sensor"),
    PatternRule("IFM", "PN", "PN", "Pressure Sensor"),
    # ------------------------------------------------------------------
    # Pilz
    # ------------------------------------------------------------------
    PatternRule("Pilz", "PNOZ", "PNOZ", "Safety Relay"),
    PatternRule("Pilz", "PMC", "PMCprimo", "Servo Drive"),
    PatternRule("Pilz", "PSS4000", "PSS4000", "Safety PLC"),
    PatternRule("Pilz", "PSS", "PSS", "Safety PLC"),
    # ------------------------------------------------------------------
    # Balluff
    # ------------------------------------------------------------------
    PatternRule("Balluff", "BES", "BES", "Inductive Sensor"),
    PatternRule("Balluff", "BNS", "BNS", "Position Sensor"),
    PatternRule("Balluff", "BTL", "BTL", "Linear Position Sensor"),
    PatternRule("Balluff", "BOS", "BOS", "Photoelectric Sensor"),
    PatternRule("Balluff", "BAM", "BAM", "Magnetic Sensor"),
    # ------------------------------------------------------------------
    # Delta
    # ------------------------------------------------------------------
    PatternRule("Delta", "VFD-", "VFD", "Drives"),
    PatternRule("Delta", "VFD", "VFD", "Drives"),
    PatternRule("Delta", "DVP28", "DVP", "PLC CPU"),
    PatternRule("Delta", "DVP", "DVP", "PLC"),
    PatternRule("Delta", "DOP-", "DOP", "HMI"),
    PatternRule("Delta", "DOP", "DOP", "HMI"),
    PatternRule("Delta", "MS300", "MS300", "Soft Starters"),
    PatternRule("Delta", "MS3", "MS", "Soft Starters"),
]

# ---------------------------------------------------------------------------
# Build sorted rules (longest prefix first for greedy matching)
# ---------------------------------------------------------------------------


def _build_sorted_rules(rules: list[PatternRule]) -> list[PatternRule]:
    """Sort rules so that longer, more specific prefixes are tried first."""
    return sorted(rules, key=lambda r: (-len(r.pattern_prefix), -r.priority))


_SORTED_RULES: list[PatternRule] = _build_sorted_rules(PATTERN_RULES)

# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

# Characters that are not alphanumeric or a dash are stripped.
_INVALID_CHARS_RE = re.compile(r"[^A-Z0-9\-]")


def normalize_part_number(part_number: str) -> str:
    """
    Normalize a raw part-number string for consistent pattern matching.

    Steps:
    1. Strip leading / trailing whitespace.
    2. Convert to uppercase.
    3. Collapse multiple dashes / spaces into a single dash.
    4. Remove any remaining non-alphanumeric, non-dash characters.

    Examples::

        >>> normalize_part_number(" 6es7 315-2eh14-0ab0 ")
        '6ES7315-2EH14-0AB0'

        >>> normalize_part_number("lc1d  25u7")
        'LC1D25U7'
    """
    pn = part_number.strip().upper()
    # Collapse whitespace runs (optionally surrounded by dashes) into a single dash
    pn = re.sub(r"[\s\-]+", "-", pn)
    # Remove invalid characters
    pn = _INVALID_CHARS_RE.sub("", pn)
    # Strip leading/trailing dashes that may remain after cleanup
    pn = pn.strip("-")
    return pn


# ---------------------------------------------------------------------------
# Detection result
# ---------------------------------------------------------------------------


@dataclass
class IntelligenceResult:
    """Structured result returned by :func:`detect_part_number_info`."""

    brand: Optional[str] = None
    series: Optional[str] = None
    category: Optional[str] = None
    normalized: str = ""
    matched_prefix: Optional[str] = None
    confidence: str = "none"  # "high" | "low" | "none"

    def matched(self) -> bool:
        return self.brand is not None

    def to_dict(self) -> dict:
        return {
            "brand": self.brand,
            "series": self.series,
            "category": self.category,
            "normalized": self.normalized,
            "matched_prefix": self.matched_prefix,
            "confidence": self.confidence,
        }


# ---------------------------------------------------------------------------
# In-memory cache (avoids repeated detection for the same part number)
# ---------------------------------------------------------------------------

# Simple TTL-aware cache: maps normalized part number → (result, timestamp).
_CACHE: dict[str, tuple[IntelligenceResult, float]] = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour


def _cache_get(key: str) -> Optional[IntelligenceResult]:
    entry = _CACHE.get(key)
    if entry is None:
        return None
    result, ts = entry
    if time.monotonic() - ts > _CACHE_TTL_SECONDS:
        del _CACHE[key]
        return None
    return result


def _cache_set(key: str, result: IntelligenceResult) -> None:
    _CACHE[key] = (result, time.monotonic())


def clear_cache() -> None:
    """Evict all cached intelligence results (useful for testing)."""
    _CACHE.clear()


# ---------------------------------------------------------------------------
# Core detection function
# ---------------------------------------------------------------------------


def detect_part_number_info(part_number: str) -> IntelligenceResult:
    """
    Detect brand, series, and category for an industrial part number.

    The function normalises the input first, then matches it against the
    ``PATTERN_RULES`` list (longest prefix first).

    Returns an :class:`IntelligenceResult`.  If no pattern matches the
    ``brand`` / ``series`` / ``category`` fields are ``None`` and
    ``confidence`` is ``"none"``.

    Results are cached in memory for :data:`_CACHE_TTL_SECONDS` to avoid
    repeated work for the same input.

    Examples::

        >>> r = detect_part_number_info("6ES7315-2EH14-0AB0")
        >>> r.brand
        'Siemens'
        >>> r.series
        'S7-300/400'
        >>> r.category
        'PLC CPU'

        >>> r = detect_part_number_info("LC1D25U7")
        >>> r.brand
        'Schneider Electric'
    """
    if not part_number or not part_number.strip():
        return IntelligenceResult(normalized="", confidence="none")

    normalized = normalize_part_number(part_number)

    # Check cache first
    cached = _cache_get(normalized)
    if cached is not None:
        return cached

    result = IntelligenceResult(normalized=normalized)

    for rule in _SORTED_RULES:
        prefix_upper = rule.pattern_prefix.upper()
        if normalized.startswith(prefix_upper):
            result.brand = rule.brand
            result.series = rule.series
            result.category = rule.category
            result.matched_prefix = rule.pattern_prefix
            result.confidence = "high"
            logger.info(
                "Detected %s %s %s from prefix %s (part: %s)",
                rule.brand,
                rule.series,
                rule.category,
                rule.pattern_prefix,
                normalized,
            )
            break

    if not result.matched():
        logger.debug("No pattern match for part number: %s", normalized)

    _cache_set(normalized, result)
    return result


# ---------------------------------------------------------------------------
# Convenience wrapper used by the product generation flow
# ---------------------------------------------------------------------------


def enrich_with_intelligence(
    part_number: str,
    existing_brand: Optional[str] = None,
    existing_series: Optional[str] = None,
    existing_category: Optional[str] = None,
) -> dict:
    """
    Return a dict of fields that should be applied to a product record,
    filling only the fields that are currently missing / empty.

    Parameters
    ----------
    part_number:
        Raw part number as received from the user or database.
    existing_brand / existing_series / existing_category:
        Current values stored in the product record (may be ``None`` or ``""``).

    Returns
    -------
    dict with keys ``brand``, ``series``, ``category`` (and ``confidence``).
    Only the fields that were *added* by intelligence (i.e., were previously
    empty) are returned; existing values are preserved.
    """
    result = detect_part_number_info(part_number)
    if not result.matched():
        return {"confidence": "none"}

    updates: dict = {"confidence": result.confidence}
    if not existing_brand and result.brand:
        updates["brand"] = result.brand
    if not existing_series and result.series:
        updates["series"] = result.series
    if not existing_category and result.category:
        updates["category"] = result.category

    return updates
