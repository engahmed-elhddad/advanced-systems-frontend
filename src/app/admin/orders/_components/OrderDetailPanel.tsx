'use client'

import type { OrderAction } from '../_hooks/useOrdersPage'
import type { OrderDetail } from '@/features/admin/services/adminService'
import { Badge } from '@/components/ui'
import { OrderActions } from './OrderActions'
import { OrderTimeline } from './OrderTimeline'
import { OrderNotes } from './OrderNotes'

interface OrderDetailPanelProps {
  order: OrderDetail | null
  loading: boolean
  actionPending: boolean
  onAction: (action: OrderAction) => void
}

const ORDER_STATUS_BADGE: Record<string, 'pending' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'pending',
  confirmed: 'info',
  delivered: 'success',
  cancelled: 'error',
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OrderDetailPanel({ order, loading, actionPending, onAction }: OrderDetailPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-white/[0.08]" />
        ))}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-sm font-medium text-white">Select an order to view details</p>
        <p className="mt-1 text-xs text-white/50">Items and actions appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">
              Order ORD-{String(order.id).padStart(5, '0')}
            </h2>
            <p className="text-xs text-white/50">Quotation #{order.quotation_id}</p>
            <p className="text-xs text-white/50">Created: {new Date(order.created_at).toLocaleString()}</p>
            {order.updated_at ? (
              <p className="text-xs text-white/50">Updated: {new Date(order.updated_at).toLocaleString()}</p>
            ) : null}
          </div>
          <Badge variant={ORDER_STATUS_BADGE[order.status.toLowerCase()] ?? 'default'} size="sm">
            {order.status}
          </Badge>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Customer</p>
            <p className="mt-1 text-sm font-medium text-white">{order.customer_name}</p>
            {order.customer_company ? <p className="text-xs text-white/50">{order.customer_company}</p> : null}
            {order.customer_email ? <p className="text-xs text-white/50">{order.customer_email}</p> : null}
            {order.customer_phone ? <p className="text-xs text-white/50">{order.customer_phone}</p> : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Pricing</p>
            <p className="mt-1 text-sm text-white/80">Items: {order.items.length}</p>
            <p className="text-sm font-semibold text-white">Total: {formatCurrency(order.total_amount)}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/40">Item</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/40">Qty</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/40">Unit</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/40">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-white/[0.06]">
                  <td className="px-3 py-2.5 text-sm text-white/80">
                    {item.description}
                    {item.product_id ? (
                      <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-300">
                        Product #{item.product_id}
                      </span>
                    ) : (
                      <span className="ml-2 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/40">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-white/80">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-sm text-white/80">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-white">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderActions order={order} pending={actionPending} onAction={onAction} />
      <OrderTimeline />
      <OrderNotes />
    </div>
  )
}
