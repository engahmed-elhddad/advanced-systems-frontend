'use client'

import { Button } from '@/components/ui/Button'
import type { B2BOrderStatus, OrderDetail } from '@/services/adminService'

interface OrderActionsProps {
  order: OrderDetail
  pending: boolean
  onAction: (status: B2BOrderStatus) => void
}

function canConfirm(status: string): boolean {
  return status === 'pending'
}

function canMarkProcessing(status: string): boolean {
  return !['cancelled', 'delivered', 'processing'].includes(status)
}

function canMarkReady(status: string): boolean {
  return ['confirmed', 'processing'].includes(status)
}

function canDeliver(status: string): boolean {
  return ['confirmed', 'processing', 'ready'].includes(status)
}

function canCancel(status: string): boolean {
  return !['cancelled', 'delivered'].includes(status)
}

export function OrderActions({ order, pending, onAction }: OrderActionsProps) {
  const status = order.status.toLowerCase()

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canConfirm(status) || pending}
          loading={pending && canConfirm(status)}
          onClick={() => onAction('confirmed')}
        >
          Confirm Order
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canMarkProcessing(status) || pending}
          loading={pending && canMarkProcessing(status)}
          onClick={() => onAction('processing')}
        >
          Mark Processing
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canMarkReady(status) || pending}
          loading={pending && canMarkReady(status)}
          onClick={() => onAction('ready')}
        >
          Mark Ready
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!canDeliver(status) || pending}
          loading={pending && canDeliver(status)}
          onClick={() => onAction('delivered')}
        >
          Mark Delivered
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="col-span-2"
          disabled={!canCancel(status) || pending}
          loading={pending && canCancel(status)}
          onClick={() => onAction('cancelled')}
        >
          Cancel Order
        </Button>
      </div>
    </div>
  )
}

