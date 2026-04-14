/**
 * Centralized DataTable localStorage I/O: versioning, TTL, safe parse, legacy fallback.
 */
/* eslint-disable no-console */

export type TableStorageEnvelope<T> = {
  dt: 1
  /** Schema / payload version (consumer-defined, e.g. columnVisibilityStorageVersion) */
  v: string
  /** Unix ms when written */
  at: number
  ttlMs?: number
  payload: T
}

function now() {
  return Date.now()
}

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function isExpired(at: number, ttlMs: number | undefined): boolean {
  if (ttlMs == null || ttlMs <= 0) return false
  return now() - at > ttlMs
}

/**
 * Read JSON envelope `{ dt:1, v, at, ttlMs?, payload }` or return undefined.
 */
export function readEnvelope<T>(raw: string | null): TableStorageEnvelope<T> | undefined {
  if (raw == null || raw.length === 0) return undefined
  try {
    const p = JSON.parse(raw) as unknown
    if (!p || typeof p !== 'object' || (p as TableStorageEnvelope<T>).dt !== 1) return undefined
    const e = p as TableStorageEnvelope<T>
    if (typeof e.v !== 'string' || typeof e.at !== 'number') return undefined
    if (isExpired(e.at, e.ttlMs)) {
      return undefined
    }
    return e
  } catch {
    return undefined
  }
}

export function writeEnvelope<T>(
  key: string | undefined,
  version: string,
  payload: T,
  ttlMs?: number,
): void {
  if (!key) return
  const body: TableStorageEnvelope<T> = {
    dt: 1,
    v: version,
    at: now(),
    ...(ttlMs != null && ttlMs > 0 ? { ttlMs } : {}),
    payload,
  }
  safeSetItem(key, JSON.stringify(body))
}

/**
 * If stored value is expired envelope, remove key (keeps valid legacy JSON).
 */
export function removeIfExpired(key: string | undefined): void {
  if (!key) return
  const raw = safeGetItem(key)
  const e = readEnvelope<unknown>(raw)
  if (raw && !e) {
    try {
      const p = JSON.parse(raw) as { at?: number; ttlMs?: number; dt?: number }
      if (p && p.dt === 1 && typeof p.at === 'number' && isExpired(p.at, p.ttlMs)) {
        safeRemoveItem(key)
      }
    } catch {
      /* ignore */
    }
  }
}

export { safeGetItem, safeSetItem, safeRemoveItem }
