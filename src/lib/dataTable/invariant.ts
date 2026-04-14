/**
 * Development-only invariant (throws). Production logs once and returns.
 */
/* eslint-disable no-console */

export function invariant(condition: unknown, message: string, tableId?: string): asserts condition {
  if (condition) return
  const prefix = tableId ? `[DataTable:${tableId}] ` : '[DataTable] '
  const full = `${prefix}${message}`
  if (process.env.NODE_ENV === 'development') {
    throw new Error(full)
  }
  console.error(full)
}
