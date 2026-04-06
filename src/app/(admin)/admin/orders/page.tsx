'use client'

import { RefreshCw } from 'lucide-react'
import { OrdersList } from './_components/OrdersList'
import { OrderDetailPanel } from './_components/OrderDetailPanel'
import { useOrdersPage } from './_hooks/useOrdersPage'
import type { B2BOrderStatus } from '@/services/adminService'

export default function OrdersPage() {
  const {
    statusFilter,
    setStatusFilter,
    selectedOrderId,
    setSelectedOrderId,
    orders,
    ordersLoading,
    ordersError,
    selectedOrder,
    detailLoading,
    timeline,
    timelineLoading,
    notes,
    notesLoading,
    statusMutation,
    notesMutation,
    refresh,
  } = useOrdersPage()

  const handleAction = (status: B2BOrderStatus) => {
    if (!selectedOrderId) return
    statusMutation.mutate({ orderId: selectedOrderId, status })
  }

  const handleAddNote = (note: string) => {
    if (!selectedOrderId) return
    notesMutation.mutate({ orderId: selectedOrderId, note })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Orders Management</h1>
          <p className="text-sm text-[#6B7280]">
            Flexible B2B order handling with real-time actions, timeline, and notes
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
          Failed to load orders. Check backend endpoints and try again.
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
          timeline={timeline}
          timelineLoading={timelineLoading}
          notes={notes}
          notesLoading={notesLoading}
          actionPending={statusMutation.isPending}
          notePending={notesMutation.isPending}
          onAction={handleAction}
          onAddNote={handleAddNote}
        />
      </div>
    </div>
  )
}

