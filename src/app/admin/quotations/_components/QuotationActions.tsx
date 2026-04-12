'use client'

import { Button } from '@/components/ui/Button'

interface QuotationActionsProps {
  status: string
  busy: boolean
  canEdit: boolean
  hasItems: boolean
  hasCustomer: boolean
  onSaveDraft: () => void
  onSend: () => void
  onApprove: () => void
  onReject: () => void
}

export function QuotationActions({
  status,
  busy,
  canEdit,
  hasItems,
  hasCustomer,
  onSaveDraft,
  onSend,
  onApprove,
  onReject,
}: QuotationActionsProps) {
  const s = status.toLowerCase()
  const canSend = (s === 'draft' || s === 'sent') && hasItems && hasCustomer
  const canApprove = s === 'sent'
  const canReject = s === 'sent'

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canEdit || busy}
          loading={busy && canEdit}
          onClick={onSaveDraft}
        >
          Save Draft
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!canSend || busy}
          loading={busy && canSend}
          onClick={onSend}
        >
          Send to Client
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canApprove || busy}
          loading={busy && canApprove}
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={!canReject || busy}
          loading={busy && canReject}
          onClick={onReject}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}

