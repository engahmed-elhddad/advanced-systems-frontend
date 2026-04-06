'use client'

import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { QuotationListItem } from '@/services/adminService'
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

function statusClasses(status: string): string {
  const s = status.toLowerCase()
  if (s === 'draft') return 'bg-[#F3F4F6] text-[#6B7280]'
  if (s === 'sent') return 'bg-[#E8F4FD] text-[#005BA4]'
  if (s === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (s === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-[#F3F4F6] text-[#6B7280]'
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
  const columns: DataTableColumn<QuotationListItem & Record<string, unknown>>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[#0072CE]">
          Q-{String(row.id).padStart(5, '0')}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <span className="text-sm text-[#1A1A1A]">{row.customer_name ?? `Customer #${row.customer_id}`}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => <span className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(row.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClasses(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => <span className="text-xs text-[#6B7280]">{new Date(row.created_at).toLocaleString()}</span>,
    },
  ]

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusFilterChange(tab.value)}
            className={`rounded-[2px] border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'border-[#0072CE] bg-[#E8F4FD] text-[#005BA4]'
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
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
        columns={columns}
        data={quotations as (QuotationListItem & Record<string, unknown>)[]}
        loading={loading}
        stickyHeader
        emptyMessage="No quotations found"
        onRowClick={(row) => onSelect(row.id)}
        rowKey={(row) => row.id}
      />

      {selectedId ? (
        <p className="mt-2 text-xs text-[#6B7280]">
          Selected: <span className="font-mono text-[#1A1A1A]">Q-{String(selectedId).padStart(5, '0')}</span>
        </p>
      ) : null}
    </div>
  )
}

