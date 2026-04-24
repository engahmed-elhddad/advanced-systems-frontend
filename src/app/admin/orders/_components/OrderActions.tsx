'use client'

import { Button } from '@/components/ui'
import type { OrderAction } from '../_hooks/useOrdersPage'
import type { OrderDetail } from '@/features/admin/services/adminService'

interface OrderActionsProps {
  order: OrderDetail
  pending: boolean
  onAction: (action: OrderAction) => void
}

/**
 * Matches backend b2b_service: cancel/confirm only from pending; deliver only from confirmed.
 */
export function OrderActions({ order, pending, onAction }: OrderActionsProps) {
  const status = order.status.toLowerCase()
  const canConfirm = status === 'pending'
  const canCancel = status === 'pending'
  const canDeliver = status === 'confirmed'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Actions</h3>
      <p className="mb-3 text-xs text-white/50">
        Flow: <span className="font-medium text-white/80">Pending</span> → confirm →{' '}
        <span className="font-medium text-white/80">Confirmed</span> → deliver →{' '}
        <span className="font-medium text-white/80">Delivered</span>.
        Cancel is only allowed while pending.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          size="sm"
          variant="primary"
          disabled={!canConfirm || pending}
          loading={pending && canConfirm}
          onClick={() => onAction('confirmed')}
        >
          Confirm order
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canDeliver || pending}
          loading={pending && canDeliver}
          onClick={() => onAction('delivered')}
        >
          Mark delivered
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={!canCancel || pending}
          loading={pending && canCancel}
          onClick={() => {
            if (!window.confirm('Cancel this order? This cannot be undone.')) return
            onAction('cancelled')
          }}
        >
          Cancel order
        </Button>
      </div>
    </div>
  )
}
