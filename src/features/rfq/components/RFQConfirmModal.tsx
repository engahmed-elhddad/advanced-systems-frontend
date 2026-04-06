'use client'

import { useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export interface RFQConfirmModalProps {
  open: boolean
  reference?: string
  onClose: () => void
}

export function RFQConfirmModal({ open, reference, onClose }: RFQConfirmModalProps) {
  const refText = useMemo(() => reference ?? 'Pending assignment', [reference])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="RFQ submitted"
      description="Your request has been received. Save your reference for follow-up."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={async () => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(refText)
              }
            }}
          >
            Copy reference
          </Button>
        </div>
      }
    >
      <div className="rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background-tertiary)] p-4">
        <p className="text-sm text-[var(--color-foreground-muted)]">Reference number</p>
        <p className="mt-1 font-mono text-lg text-[var(--color-foreground)]">{refText}</p>
      </div>
    </Modal>
  )
}
