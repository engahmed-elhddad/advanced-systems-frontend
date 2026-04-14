/**
 * Build tenant/user namespaced localStorage keys to avoid cross-tenant collisions.
 * Prefer `tenantId` + logical `baseKey` per table feature (visibility, sort, selection).
 */
/* eslint-disable no-console */

export type ScopedStorageKeyOptions = {
  tenantId?: string
  userId?: string
}

function segment(s: string): string {
  return String(s).replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * @param baseKey Logical key fragment (e.g. `admin.products.columns`) — not a full localStorage key until scoped.
 */
export function createScopedStorageKey(baseKey: string, opts: ScopedStorageKeyOptions): string {
  const parts: string[] = ['dt']
  if (opts.tenantId != null && opts.tenantId !== '') {
    parts.push(`t:${segment(opts.tenantId)}`)
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[DataTable] tenantId is required in production for storage namespacing (baseKey: ${baseKey}).`,
    )
  } else {
    console.warn(
      '[DataTable] createScopedStorageKey: tenantId is missing — storage may leak across tenants. baseKey:',
      baseKey,
    )
  }
  if (opts.userId != null && opts.userId !== '') {
    parts.push(`u:${segment(opts.userId)}`)
  }
  parts.push(baseKey)
  return parts.join('::')
}
