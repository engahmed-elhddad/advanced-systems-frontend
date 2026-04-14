/**
 * Detect duplicate `tableId` values across mounted DataTable instances (dev).
 * Enforce non-empty `tableId` for SaaS deployments.
 */
/* eslint-disable no-console */

const counts = new Map<string, number>()

export function registerDataTableInstance(tableId: string | undefined): () => void {
  if (process.env.NODE_ENV !== 'development' || !tableId) {
    return () => {}
  }
  counts.set(tableId, (counts.get(tableId) ?? 0) + 1)
  const n = counts.get(tableId)!
  if (n > 1) {
    console.warn(
      `[DataTable:${tableId}] Duplicate tableId detected (${n} active instances). Use unique tableId per grid for reliable storage and logs.`,
    )
  }
  return () => {
    const c = (counts.get(tableId) ?? 1) - 1
    if (c <= 0) counts.delete(tableId)
    else counts.set(tableId, c)
  }
}

/** Every table must set `tableId` — throws in development, warns in production. */
export function enforceTableIdRequired(tableId: string | undefined): void {
  if (tableId != null && String(tableId).trim() !== '') return
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      '[DataTable] tableId is required — set a stable id per grid for storage namespacing, observability, and support.',
    )
  }
  console.warn('[DataTable] tableId is missing — required for production SaaS (multi-tenant safety).')
}
