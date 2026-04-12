'use client'

import type { OrderAction } from '../_hooks/useOrdersPage'
import type { OrderDetail } from '@/features/admin/services/adminService'
import { OrderActions } from './OrderActions'
import { OrderTimeline } from './OrderTimeline'
import { OrderNotes } from './OrderNotes'

interface OrderDetailPanelProps {
  order: OrderDetail | null
  loading: boolean
  actionPending: boolean
  onAction: (action: OrderAction) => void
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OrderDetailPanel({ order, loading, actionPending, onAction }: OrderDetailPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
        ))}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-[#1A1A1A]">Select an order to view details</p>
        <p className="mt-1 text-xs text-[#6B7280]">Items and actions appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A]">
              Order ORD-{String(order.id).padStart(5, '0')}
            </h2>
            <p className="text-xs text-[#6B7280]">Quotation #{order.quotation_id}</p>
            <p className="text-xs text-[#6B7280]">Created: {new Date(order.created_at).toLocaleString()}</p>
            {order.updated_at ? (
              <p className="text-xs text-[#6B7280]">Updated: {new Date(order.updated_at).toLocaleString()}</p>
            ) : null}
          </div>
          <span className="rounded-[2px] bg-[#E8F4FD] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#005BA4]">
            {order.status}
          </span>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Customer</p>
            <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{order.customer_name}</p>
            {order.customer_company ? <p className="text-xs text-[#6B7280]">{order.customer_company}</p> : null}
            {order.customer_email ? <p className="text-xs text-[#6B7280]">{order.customer_email}</p> : null}
            {order.customer_phone ? <p className="text-xs text-[#6B7280]">{order.customer_phone}</p> : null}
          </div>
          <div className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Pricing</p>
            <p className="mt-1 text-sm text-[#1A1A1A]">Items: {order.items.length}</p>
            <p className="text-sm font-semibold text-[#1A1A1A]">Total: {formatCurrency(order.total_amount)}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2px] border border-[#E5E7EB]">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#6B7280]">Item</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#6B7280]">Qty</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#6B7280]">Unit</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#6B7280]">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-[#F3F4F6]">
                  <td className="px-3 py-2.5 text-sm text-[#1A1A1A]">
                    {item.description}
                    {item.product_id ? (
                      <span className="ml-2 rounded-[2px] bg-[#E8F4FD] px-1.5 py-0.5 text-[10px] text-[#005BA4]">
                        Product #{item.product_id}
                      </span>
                    ) : (
                      <span className="ml-2 rounded-[2px] bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-[#1A1A1A]">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-sm text-[#1A1A1A]">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-[#1A1A1A]">
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
