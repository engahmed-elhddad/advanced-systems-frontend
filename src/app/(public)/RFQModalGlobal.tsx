'use client'

import { RFQModal } from '@/components/rfq/RFQModal'
import { useUIStore } from '@/state/uiStore'

export function RFQModalGlobal() {
  const open = useUIStore((s) => s.rfqModalOpen)
  const partNumber = useUIStore((s) => s.rfqModalPartNumber)
  const listMode = useUIStore((s) => s.rfqListMode)
  const close = useUIStore((s) => s.closeRFQModal)

  if (!open) return null

  const product = listMode
    ? { part_number: '', name: 'Selected parts' }
    : { part_number: partNumber ?? '' }

  return <RFQModal product={product} onClose={close} />
}
