'use client'

import { type ReactNode } from 'react'

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
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  stickyHeader = false,
  rowKey,
}: DataTableProps<T>) {
  const skeletonWidths = ['56%', '72%', '64%', '83%', '61%', '74%']

  if (loading) {
    return (
      <div className="w-full border border-[#E5E7EB] rounded-[4px] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-[11px] uppercase tracking-wider text-[#6B7280] font-medium px-3 py-2.5"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-[#F3F4F6]">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5">
                    <div
                      className="h-4 bg-[#E5E7EB] rounded-[2px] animate-pulse"
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
      <div className="w-full border border-[#E5E7EB] rounded-[4px] overflow-hidden">
        <div className="text-center py-12 text-sm text-[#6B7280]">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="w-full border border-[#E5E7EB] rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={`bg-[#F9FAFB] border-b border-[#E5E7EB] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-[11px] uppercase tracking-wider text-[#6B7280] font-medium px-3 py-2.5 ${col.className ?? ''}`}
                >
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
                className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2.5 ${col.className ?? ''}`}>
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
