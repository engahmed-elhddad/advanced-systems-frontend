'use client'

/**
 * Isolated virtualized tbody — if virtualizer throws, parent can fall back to non-virtual rows.
 */
import { useVirtualizer } from '@tanstack/react-virtual'
import { flexRender, type Row } from '@tanstack/react-table'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DataTableThemeTokens } from '@/lib/dataTable/dataTableTheme'

type Props<TData> = {
  rows: Row<TData>[]
  scrollParentRef: React.RefObject<HTMLDivElement | null>
  estimateRowHeight: number
  overscan: number
  theme: DataTableThemeTokens
  bodyRowClassName?: string
  getBodyRowClassName?: (row: TData) => string | undefined
  stickyFirstColumn?: boolean
  onRowClick?: (row: TData, rowId: string) => void
  focusRingClass: string
  getNavIndex: () => number
  setNavIndex: (i: number) => void
  enableKeyboardNav: boolean
  /** When false, `aria-selected` is omitted (selection not meaningful). */
  ariaSelectionEnabled?: boolean
}

export function DataTableVirtualBody<TData>({
  rows,
  scrollParentRef,
  estimateRowHeight,
  overscan,
  theme,
  bodyRowClassName,
  getBodyRowClassName,
  stickyFirstColumn,
  onRowClick,
  focusRingClass,
  getNavIndex,
  setNavIndex,
  enableKeyboardNav,
  ariaSelectionEnabled = false,
}: Props<TData>) {
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  })

  return (
    <tbody
      style={{
        display: 'block',
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((vRow) => {
        const row = rows[vRow.index]!
        const navIdx = vRow.index
        return (
          <tr
            key={row.id}
            data-row-index={navIdx}
            tabIndex={enableKeyboardNav ? 0 : undefined}
            className={cn(
              theme.bodyRow,
              bodyRowClassName,
              getBodyRowClassName?.(row.original),
              row.getIsSelected() && theme.rowSelected,
              enableKeyboardNav && getNavIndex() === navIdx && focusRingClass,
            )}
            style={{
              display: 'table',
              position: 'absolute',
              width: '100%',
              transform: `translateY(${vRow.start}px)`,
            }}
            onClick={() => {
              if (enableKeyboardNav) setNavIndex(navIdx)
              onRowClick?.(row.original, row.id)
            }}
            onFocus={() => enableKeyboardNav && setNavIndex(navIdx)}
            role="row"
            aria-selected={ariaSelectionEnabled ? row.getIsSelected() : undefined}
          >
            {row.getVisibleCells().map((cell, cellIndex) => {
              const cmeta = cell.column.columnDef.meta as { cellClassName?: string } | undefined
              return (
                <td
                  key={cell.id}
                  className={cn(
                    cmeta?.cellClassName,
                    stickyFirstColumn && cellIndex === 0 && 'sticky left-0 z-[1] bg-inherit shadow-[1px_0_0_rgba(255,255,255,0.06)]',
                  )}
                  style={{ display: 'table-cell' }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext()) as ReactNode}
                </td>
              )
            })}
          </tr>
        )
      })}
    </tbody>
  )
}
