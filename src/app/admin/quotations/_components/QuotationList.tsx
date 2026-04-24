'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, type DataTableColumnMeta, Badge, Button, Input } from '@/components/ui'
import type { QuotationListItem } from '@/features/admin/services/adminService'
import type { QuotationStatusFilter } from '../_hooks/useQuotationsPage'

interface QuotationListProps {
  quotations: QuotationListItem[]
  loading: boolean
  statusFilter: QuotationStatusFilter
  search: string
  selectedId: number | null
  onStatusFilterChange: (value: QuotationStatusFilter) => void
  onSearchChange: (value: string) => void
  onSelect: (id: number) => void
  onCreate: () => void
}

const FILTERS: Array<{ value: QuotationStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const QUOTATION_STATUS_BADGE: Record<string, 'default' | 'info' | 'success' | 'error' | 'pending'> = {
  draft: 'default',
  sent: 'info',
  approved: 'success',
  rejected: 'error',
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function QuotationList({
  quotations,
  loading,
  statusFilter,
  search,
  selectedId,
  onStatusFilterChange,
  onSearchChange,
  onSelect,
  onCreate,
}: QuotationListProps) {
  const columns: ColumnDef<QuotationListItem & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-orange-300">
            Q-{String(row.original.id).padStart(5, '0')}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-sm text-white/80">
            {row.original.customer_name ?? `Customer #${row.original.customer_id}`}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-white">{formatCurrency(row.original.total_amount)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={QUOTATION_STATUS_BADGE[row.original.status.toLowerCase()] ?? 'default'}
            size="sm"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-white/50">
            {new Date(row.original.created_at).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusFilterChange(tab.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'border-orange-400/50 bg-orange-500/10 text-orange-200'
                : 'border-white/10 bg-transparent text-white/50 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer or quotation id..."
        />
        <Button variant="primary" size="sm" onClick={onCreate}>
          New Quotation
        </Button>
      </div>

      <DataTable
        tableId="admin-quotations"
        columns={columns}
        data={quotations as (QuotationListItem & Record<string, unknown>)[]}
        isLoading={loading}
        stickyHeader
        emptyState={<p className="py-10 text-center text-sm text-white/50">No quotations found</p>}
        onRowClick={(row) => onSelect(row.id)}
        getRowId={(row) => String(row.id)}
      />

      {selectedId ? (
        <p className="mt-2 text-xs text-white/50">
          Selected: <span className="font-mono text-white/80">Q-{String(selectedId).padStart(5, '0')}</span>
        </p>
      ) : null}
    </div>
  )
}
