'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, type DataTableColumnMeta, Badge } from '@/components/ui'
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

const ORDER_STATUS_BADGE: Record<string, 'pending' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'pending',
  confirmed: 'info',
  delivered: 'success',
  cancelled: 'error',
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
  const columns: ColumnDef<OrdersListItem & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'Order ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-orange-300">
            ORD-{String(row.original.id).padStart(5, '0')}
          </span>
        ),
      },
      {
        id: 'customer_name',
        header: 'Customer',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div>
              <p className="text-sm font-medium text-white">{r.customer_name}</p>
              {r.customer_email ? (
                <p className="text-xs text-white/50">{r.customer_email}</p>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'total_amount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-white">{formatCurrency(row.original.total_amount)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={ORDER_STATUS_BADGE[String(row.original.status).toLowerCase()] ?? 'default'} size="sm">
            {String(row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-white/50">{formatDate(row.original.created_at)}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFilterChange(f.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'border-orange-400/50 bg-orange-500/10 text-orange-200'
                : 'border-white/10 bg-transparent text-white/50 hover:bg-white/[0.05] hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        tableId="admin-orders"
        columns={columns}
        data={orders as (OrdersListItem & Record<string, unknown>)[]}
        isLoading={loading}
        emptyState={<p className="py-10 text-center text-sm text-white/50">No orders found</p>}
        getRowId={(row) => String(row.id)}
        stickyHeader
        onRowClick={(row) => onSelectOrder(row.id)}
      />

      {selectedOrderId ? (
        <p className="mt-2 text-xs text-white/50">
          Selected: <span className="font-mono text-white/80">ORD-{String(selectedOrderId).padStart(5, '0')}</span>
        </p>
      ) : null}
    </div>
  )
}
