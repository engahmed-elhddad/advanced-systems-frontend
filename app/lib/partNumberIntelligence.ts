/**
 * app/lib/partNumberIntelligence.ts
 *
 * Industrial Part Number Intelligence Engine – TypeScript implementation.
 *
 * Mirrors the logic in services/part_number_intelligence.py so that the
 * same detection can run server-side inside Next.js API routes without
 * requiring a separate Python process.
 *
 * Usage:
 *   import { detectPartNumberInfo } from "@/app/lib/partNumberIntelligence"
 *
 *   const result = detectPartNumberInfo("6ES7315-2EH14-0AB0")
 *   // → { brand: "Siemens", series: "S7-300/400", category: "PLC CPU", ... }
 */

// ---------------------------------------------------------------------------
// Data model (mirrors part_number_patterns table)
// ---------------------------------------------------------------------------

export interface PatternRule {
  brand: string
  patternPrefix: string
  series: string
  category: string
  priority?: number
}

export interface IntelligenceResult {
  brand: string | null
  series: string | null
  category: string | null
  normalized: string
  matchedPrefix: string | null
  confidence: "high" | "low" | "none"
}

// ---------------------------------------------------------------------------
// Pattern rules database
// New brands / patterns can be added here without changing any other code.
// ---------------------------------------------------------------------------

export const PATTERN_RULES: PatternRule[] = [
  // Siemens
  { brand: "Siemens", patternPrefix: "6ES7", series: "S7-300/400", category: "PLC CPU" },
  { brand: "Siemens", patternPrefix: "6ES5", series: "S5", category: "PLC" },
  { brand: "Siemens", patternPrefix: "6AV6", series: "SIMATIC HMI", category: "HMI" },
  { brand: "Siemens", patternPrefix: "6AV2", series: "SIMATIC HMI", category: "HMI" },
  { brand: "Siemens", patternPrefix: "6AV3", series: "SIMATIC HMI", category: "HMI" },
  { brand: "Siemens", patternPrefix: "6GK7", series: "SIMATIC NET", category: "Communication Processor" },
  { brand: "Siemens", patternPrefix: "6GK5", series: "SCALANCE", category: "Network Switch" },
  { brand: "Siemens", patternPrefix: "6SE7", series: "SIMOVERT", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6SL3", series: "SINAMICS", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6SE6", series: "MICROMASTER", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6RA8", series: "SINAMICS DC", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6EP1", series: "SITOP", category: "Power Supply" },
  { brand: "Siemens", patternPrefix: "6EP3", series: "SITOP", category: "Power Supply" },
  { brand: "Siemens", patternPrefix: "3RT2", series: "SIRIUS", category: "Contactor" },
  { brand: "Siemens", patternPrefix: "3RT1", series: "SIRIUS", category: "Contactor" },
  { brand: "Siemens", patternPrefix: "3RU2", series: "SIRIUS", category: "Overload Relay" },
  { brand: "Siemens", patternPrefix: "3RU1", series: "SIRIUS", category: "Overload Relay" },
  { brand: "Siemens", patternPrefix: "3RK", series: "SIRIUS", category: "Safety Relay" },
  { brand: "Siemens", patternPrefix: "3TK", series: "SIRIUS", category: "Safety Relay" },
  { brand: "Siemens", patternPrefix: "7MH", series: "SIWAREX", category: "Sensors" },
  { brand: "Siemens", patternPrefix: "6ES", series: "S7", category: "PLC" },
  { brand: "Siemens", patternPrefix: "6AV", series: "SIMATIC HMI", category: "HMI" },
  { brand: "Siemens", patternPrefix: "6SE", series: "SINAMICS", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6SL", series: "SINAMICS", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6RA", series: "SINAMICS DC", category: "Drives" },
  { brand: "Siemens", patternPrefix: "6EP", series: "SITOP", category: "Power Supply" },
  { brand: "Siemens", patternPrefix: "3RT", series: "SIRIUS", category: "Contactor" },
  { brand: "Siemens", patternPrefix: "3RU", series: "SIRIUS", category: "Overload Relay" },

  // Schneider Electric
  { brand: "Schneider Electric", patternPrefix: "LC1D", series: "TeSys D", category: "Contactor" },
  { brand: "Schneider Electric", patternPrefix: "LC1F", series: "TeSys F", category: "Contactor" },
  { brand: "Schneider Electric", patternPrefix: "LC1K", series: "TeSys K", category: "Contactor" },
  { brand: "Schneider Electric", patternPrefix: "LR2D", series: "TeSys D", category: "Overload Relay" },
  { brand: "Schneider Electric", patternPrefix: "LR9F", series: "TeSys F", category: "Overload Relay" },
  { brand: "Schneider Electric", patternPrefix: "ATV71", series: "Altivar 71", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "ATV61", series: "Altivar 61", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "ATV32", series: "Altivar 32", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "ATV31", series: "Altivar 31", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "ATV12", series: "Altivar 12", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "ATV", series: "Altivar", category: "Drives" },
  { brand: "Schneider Electric", patternPrefix: "HMIG", series: "Magelis", category: "HMI" },
  { brand: "Schneider Electric", patternPrefix: "HMIGU", series: "Magelis", category: "HMI" },
  { brand: "Schneider Electric", patternPrefix: "XPSMF", series: "Preventa", category: "Safety Relay" },
  { brand: "Schneider Electric", patternPrefix: "TM241", series: "Modicon M241", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "TM251", series: "Modicon M251", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "TM221", series: "Modicon M221", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "TM5", series: "Modicon M580", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "TM3", series: "Modicon M340", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "TM2", series: "Modicon M2xx", category: "PLC" },
  { brand: "Schneider Electric", patternPrefix: "ZB", series: "Harmony", category: "Pushbutton" },
  { brand: "Schneider Electric", patternPrefix: "XB4", series: "Harmony", category: "Pushbutton" },
  { brand: "Schneider Electric", patternPrefix: "XB5", series: "Harmony", category: "Pushbutton" },

  // ABB
  { brand: "ABB", patternPrefix: "ACS880", series: "ACS880", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACS580", series: "ACS580", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACS550", series: "ACS550", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACS355", series: "ACS355", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACS310", series: "ACS310", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACQ810", series: "ACQ810", category: "Drives" },
  { brand: "ABB", patternPrefix: "ACS", series: "ACS", category: "Drives" },
  { brand: "ABB", patternPrefix: "PSTB", series: "PST", category: "Soft Starters" },
  { brand: "ABB", patternPrefix: "PSR", series: "PSR", category: "Soft Starters" },
  { brand: "ABB", patternPrefix: "PST", series: "PST", category: "Soft Starters" },
  { brand: "ABB", patternPrefix: "CP6", series: "CP600", category: "HMI" },
  { brand: "ABB", patternPrefix: "CP62", series: "CP600", category: "HMI" },
  { brand: "ABB", patternPrefix: "AF", series: "AF-Series", category: "Contactor" },

  // Omron
  { brand: "Omron", patternPrefix: "NX701", series: "NX7", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "NX102", series: "NX1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "NJ501", series: "NJ5", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "NJ301", series: "NJ3", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "NJ101", series: "NJ1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CJ2M", series: "CJ2", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CJ2H", series: "CJ2", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CJ1M", series: "CJ1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CJ1H", series: "CJ1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CP1L", series: "CP1L", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CP1H", series: "CP1H", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CP1E", series: "CP1E", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CS1D", series: "CS1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "CS1H", series: "CS1", category: "PLC CPU" },
  { brand: "Omron", patternPrefix: "NX1", series: "NX1", category: "PLC" },
  { brand: "Omron", patternPrefix: "NJ5", series: "NJ5", category: "PLC" },
  { brand: "Omron", patternPrefix: "NJ3", series: "NJ3", category: "PLC" },
  { brand: "Omron", patternPrefix: "NJ1", series: "NJ1", category: "PLC" },
  { brand: "Omron", patternPrefix: "CJ2", series: "CJ2", category: "PLC" },
  { brand: "Omron", patternPrefix: "CJ1", series: "CJ1", category: "PLC" },
  { brand: "Omron", patternPrefix: "CS1", series: "CS1", category: "PLC" },
  { brand: "Omron", patternPrefix: "CP1", series: "CP1", category: "PLC" },
  { brand: "Omron", patternPrefix: "E2E", series: "E2E", category: "Proximity Sensor" },
  { brand: "Omron", patternPrefix: "E2B", series: "E2B", category: "Proximity Sensor" },
  { brand: "Omron", patternPrefix: "E2C", series: "E2C", category: "Proximity Sensor" },
  { brand: "Omron", patternPrefix: "E3F", series: "E3F", category: "Photoelectric Sensor" },
  { brand: "Omron", patternPrefix: "E3Z", series: "E3Z", category: "Photoelectric Sensor" },
  { brand: "Omron", patternPrefix: "E5C", series: "E5C", category: "Temperature Controller" },
  { brand: "Omron", patternPrefix: "E5E", series: "E5E", category: "Temperature Controller" },
  { brand: "Omron", patternPrefix: "NS10", series: "NS", category: "HMI" },
  { brand: "Omron", patternPrefix: "NS12", series: "NS", category: "HMI" },
  { brand: "Omron", patternPrefix: "NS5", series: "NS", category: "HMI" },
  { brand: "Omron", patternPrefix: "NB7", series: "NB", category: "HMI" },
  { brand: "Omron", patternPrefix: "NB5", series: "NB", category: "HMI" },
  { brand: "Omron", patternPrefix: "NS", series: "NS", category: "HMI" },
  { brand: "Omron", patternPrefix: "NB", series: "NB", category: "HMI" },
  { brand: "Omron", patternPrefix: "3G3MX", series: "MX2", category: "Drives" },
  { brand: "Omron", patternPrefix: "3G3", series: "3G3", category: "Drives" },

  // Mitsubishi
  { brand: "Mitsubishi", patternPrefix: "FX5U", series: "FX5U", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX5UJ", series: "FX5UJ", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX3U", series: "FX3U", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX3G", series: "FX3G", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX2N", series: "FX2N", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX1N", series: "FX1N", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "FX5", series: "FX5", category: "PLC" },
  { brand: "Mitsubishi", patternPrefix: "FX3", series: "FX3", category: "PLC" },
  { brand: "Mitsubishi", patternPrefix: "FX2", series: "FX2", category: "PLC" },
  { brand: "Mitsubishi", patternPrefix: "FX1", series: "FX1", category: "PLC" },
  { brand: "Mitsubishi", patternPrefix: "Q06", series: "Q-Series", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "Q03", series: "Q-Series", category: "PLC CPU" },
  { brand: "Mitsubishi", patternPrefix: "A1S", series: "A-Series", category: "PLC" },
  { brand: "Mitsubishi", patternPrefix: "FR-A8", series: "FR-A800", category: "Drives" },
  { brand: "Mitsubishi", patternPrefix: "FR-F8", series: "FR-F800", category: "Drives" },
  { brand: "Mitsubishi", patternPrefix: "FR-E8", series: "FR-E800", category: "Drives" },
  { brand: "Mitsubishi", patternPrefix: "FR-D7", series: "FR-D700", category: "Drives" },
  { brand: "Mitsubishi", patternPrefix: "FR-", series: "FR-Series", category: "Drives" },
  { brand: "Mitsubishi", patternPrefix: "MR-J5", series: "MR-J5", category: "Servo" },
  { brand: "Mitsubishi", patternPrefix: "MR-J4", series: "MR-J4", category: "Servo" },
  { brand: "Mitsubishi", patternPrefix: "MR-", series: "MR-Series", category: "Servo" },
  { brand: "Mitsubishi", patternPrefix: "GT27", series: "GOT2000", category: "HMI" },
  { brand: "Mitsubishi", patternPrefix: "GT25", series: "GOT2000", category: "HMI" },
  { brand: "Mitsubishi", patternPrefix: "GT21", series: "GOT2000", category: "HMI" },
  { brand: "Mitsubishi", patternPrefix: "GT", series: "GOT", category: "HMI" },

  // SICK
  { brand: "SICK", patternPrefix: "CLV6", series: "CLV600", category: "Barcode Scanner" },
  { brand: "SICK", patternPrefix: "CLV5", series: "CLV500", category: "Barcode Scanner" },
  { brand: "SICK", patternPrefix: "CLV", series: "CLV", category: "Barcode Scanner" },
  { brand: "SICK", patternPrefix: "WTB4", series: "WTB4", category: "Photoelectric Sensor" },
  { brand: "SICK", patternPrefix: "WTB", series: "WTB", category: "Photoelectric Sensor" },
  { brand: "SICK", patternPrefix: "WL12", series: "W12", category: "Photoelectric Sensor" },
  { brand: "SICK", patternPrefix: "WL1", series: "WL100", category: "Photoelectric Sensor" },
  { brand: "SICK", patternPrefix: "IM08", series: "IM", category: "Inductive Sensor" },
  { brand: "SICK", patternPrefix: "IM0", series: "IM", category: "Inductive Sensor" },
  { brand: "SICK", patternPrefix: "S300", series: "S300", category: "Safety Relay" },
  { brand: "SICK", patternPrefix: "S3000", series: "S3000", category: "Safety Scanner" },
  { brand: "SICK", patternPrefix: "TIM5", series: "TiM5xx", category: "LiDAR" },
  { brand: "SICK", patternPrefix: "LMS2", series: "LMS200", category: "LiDAR" },

  // IFM
  { brand: "IFM", patternPrefix: "OGH", series: "OG", category: "Photoelectric Sensor" },
  { brand: "IFM", patternPrefix: "OG", series: "OG", category: "Photoelectric Sensor" },
  { brand: "IFM", patternPrefix: "IA", series: "IA", category: "Inductive Sensor" },
  { brand: "IFM", patternPrefix: "IFB", series: "IFB", category: "Inductive Sensor" },
  { brand: "IFM", patternPrefix: "KI8", series: "KI", category: "Capacitive Sensor" },
  { brand: "IFM", patternPrefix: "KI", series: "KI", category: "Capacitive Sensor" },
  { brand: "IFM", patternPrefix: "EF", series: "EF", category: "Flow Sensor" },
  { brand: "IFM", patternPrefix: "SA", series: "SA", category: "Flow Sensor" },
  { brand: "IFM", patternPrefix: "PN7", series: "PN7", category: "Pressure Sensor" },
  { brand: "IFM", patternPrefix: "PN", series: "PN", category: "Pressure Sensor" },

  // Pilz
  { brand: "Pilz", patternPrefix: "PNOZ", series: "PNOZ", category: "Safety Relay" },
  { brand: "Pilz", patternPrefix: "PMC", series: "PMCprimo", category: "Servo Drive" },
  { brand: "Pilz", patternPrefix: "PSS4000", series: "PSS4000", category: "Safety PLC" },
  { brand: "Pilz", patternPrefix: "PSS", series: "PSS", category: "Safety PLC" },

  // Balluff
  { brand: "Balluff", patternPrefix: "BES", series: "BES", category: "Inductive Sensor" },
  { brand: "Balluff", patternPrefix: "BNS", series: "BNS", category: "Position Sensor" },
  { brand: "Balluff", patternPrefix: "BTL", series: "BTL", category: "Linear Position Sensor" },
  { brand: "Balluff", patternPrefix: "BOS", series: "BOS", category: "Photoelectric Sensor" },
  { brand: "Balluff", patternPrefix: "BAM", series: "BAM", category: "Magnetic Sensor" },

  // Delta
  { brand: "Delta", patternPrefix: "VFD-", series: "VFD", category: "Drives" },
  { brand: "Delta", patternPrefix: "VFD", series: "VFD", category: "Drives" },
  { brand: "Delta", patternPrefix: "DVP28", series: "DVP", category: "PLC CPU" },
  { brand: "Delta", patternPrefix: "DVP", series: "DVP", category: "PLC" },
  { brand: "Delta", patternPrefix: "DOP-", series: "DOP", category: "HMI" },
  { brand: "Delta", patternPrefix: "DOP", series: "DOP", category: "HMI" },
  { brand: "Delta", patternPrefix: "MS300", series: "MS300", category: "Soft Starters" },
  { brand: "Delta", patternPrefix: "MS3", series: "MS", category: "Soft Starters" },
]

// ---------------------------------------------------------------------------
// Sort rules: longest prefix first for greedy (most-specific) matching
// ---------------------------------------------------------------------------

const SORTED_RULES: PatternRule[] = [...PATTERN_RULES].sort(
  (a, b) =>
    b.patternPrefix.length - a.patternPrefix.length ||
    (b.priority ?? 0) - (a.priority ?? 0)
)

// ---------------------------------------------------------------------------
// Part number normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw part-number string for consistent pattern matching.
 *
 * Steps:
 * 1. Strip leading / trailing whitespace.
 * 2. Convert to uppercase.
 * 3. Collapse runs of spaces/dashes into a single dash.
 * 4. Remove characters that are not alphanumeric or a dash.
 * 5. Strip leading/trailing dashes.
 *
 * @example
 * normalizePartNumber(" 6es7 315-2eh14-0ab0 ") // → "6ES7315-2EH14-0AB0"
 * normalizePartNumber("lc1d  25u7")             // → "LC1D25U7"
 */
export function normalizePartNumber(raw: string): string {
  let pn = raw.trim().toUpperCase()
  // Collapse spaces/dashes into a single dash
  pn = pn.replace(/[\s\-]+/g, "-")
  // Remove invalid characters (keep alphanumeric and dash)
  pn = pn.replace(/[^A-Z0-9\-]/g, "")
  // Strip leading/trailing dashes
  pn = pn.replace(/^\-+|\-+$/g, "")
  return pn
}

// ---------------------------------------------------------------------------
// In-memory cache (1-hour TTL)
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: IntelligenceResult
  expiresAt: number
}

const _cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function cacheGet(key: string): IntelligenceResult | null {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key)
    return null
  }
  return entry.result
}

function cacheSet(key: string, result: IntelligenceResult): void {
  _cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
}

/** Evict all cached results (useful for testing). */
export function clearCache(): void {
  _cache.clear()
}

// ---------------------------------------------------------------------------
// Core detection function
// ---------------------------------------------------------------------------

/**
 * Detect brand, series, and category for an industrial part number.
 *
 * The input is normalised first, then matched against PATTERN_RULES (longest
 * prefix first).  Results are cached for 1 hour.
 *
 * @example
 * detectPartNumberInfo("6ES7315-2EH14-0AB0")
 * // → { brand: "Siemens", series: "S7-300/400", category: "PLC CPU", ... }
 *
 * detectPartNumberInfo("LC1D25U7")
 * // → { brand: "Schneider Electric", series: "TeSys D", category: "Contactor", ... }
 *
 * detectPartNumberInfo("UNKNOWN-PART")
 * // → { brand: null, series: null, category: null, confidence: "none", ... }
 */
export function detectPartNumberInfo(partNumber: string): IntelligenceResult {
  if (!partNumber || !partNumber.trim()) {
    return {
      brand: null,
      series: null,
      category: null,
      normalized: "",
      matchedPrefix: null,
      confidence: "none",
    }
  }

  const normalized = normalizePartNumber(partNumber)

  const cached = cacheGet(normalized)
  if (cached) return cached

  let result: IntelligenceResult = {
    brand: null,
    series: null,
    category: null,
    normalized,
    matchedPrefix: null,
    confidence: "none",
  }

  for (const rule of SORTED_RULES) {
    if (normalized.startsWith(rule.patternPrefix.toUpperCase())) {
      result = {
        brand: rule.brand,
        series: rule.series,
        category: rule.category,
        normalized,
        matchedPrefix: rule.patternPrefix,
        confidence: "high",
      }
      break
    }
  }

  cacheSet(normalized, result)
  return result
}
