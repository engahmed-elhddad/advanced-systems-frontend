/**
 * Column / bulk-action visibility from role allow-lists.
 */
/* eslint-disable no-console */

import type { ColumnDef } from '@tanstack/react-table'

function columnId<TData>(c: ColumnDef<TData, unknown>): string {
  return String(c.id ?? (c as { accessorKey?: string }).accessorKey ?? '')
}

/** If map has no entry for a column id, column is allowed. If entry exists, user must have one of the roles. */
export function filterColumnsByRoles<TData>(
  columns: ColumnDef<TData, unknown>[],
  userRoles: string[] | undefined,
  columnPermissions: Record<string, string[]> | undefined,
): ColumnDef<TData, unknown>[] {
  if (!columnPermissions || Object.keys(columnPermissions).length === 0) return columns
  const roles = new Set((userRoles ?? []).map((r) => r.toLowerCase()))
  return columns.filter((c) => {
    const id = columnId(c)
    if (!id) return true
    const allowed = columnPermissions[id]
    if (allowed == null || allowed.length === 0) return true
    const ok = allowed.some((r) => roles.has(r.toLowerCase()))
    if (process.env.NODE_ENV === 'development' && !ok) {
      console.warn(`[DataTable RBAC] Column "${id}" hidden — user roles do not match columnPermissions.`)
    }
    return ok
  })
}

export function canUseBulkAction(
  actionId: string,
  userRoles: string[] | undefined,
  actionPermissions: Record<string, string[]> | undefined,
): boolean {
  if (!actionPermissions) return true
  const allowed = actionPermissions[actionId]
  if (allowed == null || allowed.length === 0) return true
  const roles = new Set((userRoles ?? []).map((r) => r.toLowerCase()))
  const ok = allowed.some((r) => roles.has(r.toLowerCase()))
  if (process.env.NODE_ENV === 'development' && !ok) {
    console.warn(`[DataTable RBAC] Bulk action "${actionId}" hidden — permission mismatch.`)
  }
  return ok
}
