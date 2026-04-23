'use client'

import { RefreshCw } from 'lucide-react'
import { OrdersList } from './_components/OrdersList'
import { OrderDetailPanel } from './_components/OrderDetailPanel'
import { useOrdersPage } from './_hooks/useOrdersPage'
import type { OrderAction } from './_hooks/useOrdersPage'

export default function OrdersPage() {
  const {
    statusFilter,
    setStatusFilter,
    listPage,
    setListPage,
    hasNextOrdersPage,
    hasPrevOrdersPage,
    selectedOrderId,
    setSelectedOrderId,
    orders,
    ordersLoading,
    ordersError,
    selectedOrder,
    detailLoading,
    statusMutation,
    refresh,
  } = useOrdersPage()

  const handleAction = (action: OrderAction) => {
    if (!selectedOrderId) return
    statusMutation.mutate({ orderId: selectedOrderId, action })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Orders Management</h1>
          <p className="text-sm text-[#6B7280]">
            B2B orders: pending → confirmed → delivered, or cancel while pending (matches API).
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {ordersError ? (
        <div className="rounded-[4px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load orders. Confirm you are signed in to admin and the B2B API is available, then use Refresh.
        </div>
      ) : null}

      {!ordersError && (hasPrevOrdersPage || hasNextOrdersPage) ? (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#6B7280]">
          <span className="font-mono">Page {listPage}</span>
          <button
            type="button"
            disabled={!hasPrevOrdersPage || ordersLoading}
            onClick={() => setListPage((p: number) => Math.max(1, p - 1))}
            className="rounded-[2px] border border-[#E5E7EB] bg-white px-2 py-1 font-medium text-[#1A1A1A] disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!hasNextOrdersPage || ordersLoading}
            onClick={() => setListPage((p: number) => p + 1)}
            className="rounded-[2px] border border-[#E5E7EB] bg-white px-2 py-1 font-medium text-[#1A1A1A] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <OrdersList
          orders={orders}
          loading={ordersLoading}
          selectedOrderId={selectedOrderId}
          filter={statusFilter}
          onFilterChange={setStatusFilter}
          onSelectOrder={setSelectedOrderId}
        />
        <OrderDetailPanel
          order={selectedOrder ?? null}
          loading={detailLoading}
          actionPending={statusMutation.isPending}
          onAction={handleAction}
        />
      </div>
    </div>
  )
}
