'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Empty } from '@/components/shared/Empty'
import { Skeleton } from '@/components/ui/Skeleton'

export interface TableColumn<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  empty?: React.ReactNode
  onSort?: (key: string, dir: 'asc' | 'desc') => void
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  stickyHeader?: boolean
  rowKey: (row: T, index: number) => string | number
  onRowClick?: (row: T, index: number) => void
  className?: string
}

interface RowProps<T> {
  row: T
  columns: TableColumn<T>[]
  index: number
}

function TableRowComponent<T>({ row, columns, index }: RowProps<T>) {
  return (
    <>
      {columns.map((col) => (
        <td
          key={col.key}
          className={cn(
            'whitespace-nowrap px-3 py-2 text-sm text-[var(--color-foreground)]',
            col.align === 'center' && 'text-center',
            col.align === 'right' && 'text-right'
          )}
          style={col.width ? { width: col.width } : undefined}
        >
          {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
        </td>
      ))}
    </>
  )
}

const TableRowMemo = React.memo(TableRowComponent) as typeof TableRowComponent

export function Table<T>({
  columns,
  data,
  loading,
  empty,
  onSort,
  sortKey,
  sortDir,
  stickyHeader,
  rowKey,
  onRowClick,
  className,
}: TableProps<T>) {
  const skeletonRows = 5

  const defaultEmpty = (
    <Empty
      icon={<Package className="h-12 w-12 opacity-50" aria-hidden />}
      title="Nothing here yet"
      description="Try adjusting filters or check back later."
    />
  )

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left" aria-label="Data table">
        <thead
          className={cn(
            'bg-[var(--color-background-secondary)] text-[length:var(--text-12)] font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]',
            stickyHeader && 'sticky top-0 z-10'
          )}
        >
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-3 py-2',
                    col.sortable && onSort && 'cursor-pointer select-none text-[var(--color-foreground)]',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => {
                  if (!col.sortable || !onSort) return
                  const next =
                    sortKey === col.key && sortDir === 'asc' ? ('desc' as const) : ('asc' as const)
                  onSort(col.key, next)
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key ? (
                    sortDir === 'asc' ? (
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    )
                  ) : col.sortable ? (
                    <span className="text-[10px] text-[var(--color-foreground-muted)]" aria-hidden>
                      ↕
                    </span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={`sk-${r}`} className="border-b border-[var(--color-border)]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <Skeleton variant="line" height={14} className="w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      {empty ?? defaultEmpty}
                    </td>
                  </tr>
                )
              : data.map((row, index) => (
                  <tr
                    key={String(rowKey(row, index))}
                    role="row"
                    className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-background-tertiary)]/60"
                    onClick={() => onRowClick?.(row, index)}
                  >
                    <TableRowMemo row={row} columns={columns} index={index} />
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}
