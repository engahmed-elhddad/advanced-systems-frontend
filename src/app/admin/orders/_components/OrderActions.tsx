'use client'

import { Button } from '@/components/ui/Button'
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
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Actions</h3>
      <p className="mb-3 text-xs text-[#6B7280]">
        Flow: <span className="font-medium">Pending</span> → confirm →{' '}
        <span className="font-medium">Confirmed</span> → deliver → <span className="font-medium">Delivered</span>.
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
          onClick={() => onAction('cancelled')}
        >
          Cancel order
        </Button>
      </div>
    </div>
  )
}
