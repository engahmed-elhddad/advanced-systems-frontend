/**
 * Type-safe default `getRowId` for rows with `id: string | number`.
 * Use with `DataTable` / `DataTableIdentifiableRow` to avoid ad-hoc string coercion.
 *
 * @example
 * ```tsx
 * <DataTable getRowId={createGetRowId<AdminProduct>()} ... />
 * ```
 */
export function createGetRowId<T extends { id: string | number }>(): (row: T) => string {
  return (row) => String(row.id)
}
