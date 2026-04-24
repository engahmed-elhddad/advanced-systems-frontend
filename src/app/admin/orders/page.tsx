'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
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
          <h1 className="text-xl font-bold text-white">Orders Management</h1>
          <p className="text-sm text-white/50">
            B2B orders: pending → confirmed → delivered, or cancel while pending (matches API).
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {ordersError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load orders. Confirm you are signed in to admin and the B2B API is available, then use Refresh.
        </div>
      ) : null}

      {!ordersError && (hasPrevOrdersPage || hasNextOrdersPage) ? (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-white/50">
          <span className="font-mono">Page {listPage}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPrevOrdersPage || ordersLoading}
            onClick={() => setListPage((p: number) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNextOrdersPage || ordersLoading}
            onClick={() => setListPage((p: number) => p + 1)}
          >
            Next
          </Button>
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
