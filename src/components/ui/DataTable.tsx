'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T, index: number) => void
  stickyHeader?: boolean
  rowKey?: (row: T, index: number) => string | number
  /** `dark` = glass table on marketplace background */
  variant?: 'light' | 'dark'
  /** Extra classes per row (e.g. highlight high-intent leads). */
  rowClassName?: (row: T, index: number) => string | undefined
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  stickyHeader = false,
  rowKey,
  variant = 'light',
  rowClassName,
}: DataTableProps<T>) {
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
                    {col.render
                      ? col.render(row, index)
                      : String(row[col.key] ?? '')}
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
