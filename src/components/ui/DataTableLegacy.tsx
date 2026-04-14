'use client'

/**
 * Legacy column-key table — prefer `DataTable` from `@/components/ui`.
 * eslint-disable-next-line import/no-deprecated -- intentional legacy module
 */

import { type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * @deprecated Use `DataTable` from `@/components/ui` (TanStack). This legacy column-key grid remains for a few admin lists until they migrate.
 * eslint import/no-deprecated: importing this module is intentional for legacy screens only.
 */
export interface DataTableLegacyColumn<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

/** @deprecated See {@link DataTableLegacyColumn}. */
export interface DataTableLegacyProps<T> {
  columns: DataTableLegacyColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T, index: number) => void
  stickyHeader?: boolean
  rowKey?: (row: T, index: number) => string | number
  variant?: 'light' | 'dark'
  rowClassName?: (row: T, index: number) => string | undefined
  /**
   * In development, legacy tables must set `allowLegacyTable: true` or the component throws.
   * Migrate to `DataTable` from `@/components/ui` (TanStack).
   */
  allowLegacyTable?: boolean
}

/**
 * @deprecated Legacy column-key table. Prefer `DataTable` from `@/components/ui`.
 */
export function DataTableLegacy<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  stickyHeader = false,
  rowKey,
  variant = 'light',
  rowClassName,
  allowLegacyTable,
}: DataTableLegacyProps<T>) {
  if (process.env.NODE_ENV === 'development' && allowLegacyTable !== true) {
    throw new Error(
      '[DataTableLegacy] This legacy column-key table is blocked in development unless you pass allowLegacyTable={true}. ' +
        'Migrate to DataTable from @/components/ui (TanStack) with getRowId and ColumnDef — see DataTable.tsx JSDoc examples.',
    )
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- deprecation notice
      console.warn(
        '[deprecated] Legacy DataTable is deprecated. Use DataTable from @/components/ui (TanStack).',
      )
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || allowLegacyTable !== true) return
    try {
      const k = '__dataTableLegacyUsage'
      const n = Number(sessionStorage.getItem(k) ?? '0') + 1
      sessionStorage.setItem(k, String(n))
      // eslint-disable-next-line no-console -- dev analytics
      console.info('[DataTableLegacy] allowLegacyTable session usage count:', n)
    } catch {
      /* ignore */
    }
  }, [allowLegacyTable])

  const skeletonWidths = ['56%', '72%', '64%', '83%', '61%', '74%']
  const isDark = variant === 'dark'
  const wrap = cn(
    'w-full overflow-hidden rounded-xl',
    isDark
      ? 'border border-white/10 bg-white/[0.04] shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl'
      : 'border border-[#E5E7EB] rounded-[4px]',
  )
  const thRow = cn(
    'border-b',
    isDark ? 'border-white/[0.08] bg-white/[0.06]' : 'border-[#E5E7EB] bg-[#F9FAFB]',
    stickyHeader && 'sticky top-0 z-10',
  )
  const thText = cn(
    'text-left text-[11px] uppercase tracking-wider font-medium px-3 py-2.5',
    isDark ? 'text-white/45' : 'text-[#6B7280]',
  )
  const rowBorder = isDark ? 'border-white/[0.06]' : 'border-[#F3F4F6]'
  const rowHover = isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-[#F9FAFB]'
  const skeletonBg = isDark ? 'bg-white/10' : 'bg-[#E5E7EB]'
  const emptyText = isDark ? 'text-white/50' : 'text-[#6B7280]'
  const tdText = isDark ? 'text-white/90' : ''

  if (loading) {
    return (
      <div className={wrap}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={thRow}>
              {columns.map((col) => (
                <th key={col.key} className={cn(thText, col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className={cn('border-b', rowBorder)}>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-2.5', tdText)}>
                    <div
                      className={cn('h-4 rounded-md animate-pulse', skeletonBg)}
                      style={{ width: skeletonWidths[i % skeletonWidths.length] }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={wrap}>
        <div className={cn('py-14 text-center text-sm', emptyText)}>{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className={wrap}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={thRow}>
              {columns.map((col) => (
                <th key={col.key} className={cn(thText, col.className ?? '')}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                className={cn(
                  'border-b transition-colors duration-300',
                  rowBorder,
                  rowHover,
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row, index),
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-2.5', tdText, col.className ?? '')}>
                    {col.render ? col.render(row, index) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** @deprecated Alias for migration — use {@link DataTableLegacyColumn}. */
export type DataTableColumn<T> = DataTableLegacyColumn<T>
/** @deprecated Alias for migration — use {@link DataTableLegacyProps}. */
export type DataTableProps<T> = DataTableLegacyProps<T>
/** @deprecated Alias for migration — use {@link DataTableLegacy}. */
export const DataTable = DataTableLegacy
