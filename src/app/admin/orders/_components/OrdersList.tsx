'use client'

import { DataTable, type DataTableColumn } from '@/components/ui/DataTableLegacy'
import type { OrdersListItem } from '@/features/admin/services/adminService'
import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'

interface OrdersListProps {
  orders: OrdersListItem[]
  loading: boolean
  selectedOrderId: number | null
  filter: FilterValue
  onFilterChange: (value: FilterValue) => void
  onSelectOrder: (orderId: number) => void
}

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusClass(status: string): string {
  const value = status.toLowerCase()
  if (value === 'pending') return 'bg-amber-100 text-amber-800'
  if (value === 'confirmed') return 'bg-[#E8F4FD] text-[#005BA4]'
  if (value === 'delivered') return 'bg-emerald-100 text-emerald-700'
  if (value === 'cancelled') return 'bg-red-100 text-red-700'
  return 'bg-[#F3F4F6] text-[#6B7280]'
}

function formatCurrency(total: number): string {
  return `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

export function OrdersList({
  orders,
  loading,
  selectedOrderId,
  filter,
  onFilterChange,
  onSelectOrder,
}: OrdersListProps) {
  const columns: DataTableColumn<OrdersListItem & Record<string, unknown>>[] = [
    {
      key: 'id',
      header: 'Order ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[#0072CE]">
          ORD-{String(row.id).padStart(5, '0')}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">{row.customer_name}</p>
          {row.customer_email ? (
            <p className="text-xs text-[#6B7280]">{row.customer_email}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (row) => (
        <span className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={cn(
            'inline-flex rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
            statusClass(String(row.status)),
          )}
        >
          {String(row.status)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => <span className="text-xs text-[#6B7280]">{formatDate(row.created_at)}</span>,
    },
  ]

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFilterChange(f.value)}
            className={cn(
              'rounded-[2px] border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'border-[#0072CE] bg-[#E8F4FD] text-[#005BA4]'
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        allowLegacyTable
        columns={columns}
        data={orders as (OrdersListItem & Record<string, unknown>)[]}
        loading={loading}
        emptyMessage="No orders found"
        stickyHeader
        rowKey={(row) => row.id}
        onRowClick={(row) => onSelectOrder(row.id)}
      />

      {selectedOrderId ? (
        <p className="mt-2 text-xs text-[#6B7280]">
          Selected: <span className="font-mono text-[#1A1A1A]">ORD-{String(selectedOrderId).padStart(5, '0')}</span>
        </p>
      ) : null}
    </div>
  )
}

