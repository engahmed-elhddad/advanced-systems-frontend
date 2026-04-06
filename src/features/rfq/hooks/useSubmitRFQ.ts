'use client'

import { useMutation } from '@tanstack/react-query'
import { submitRFQ } from '@/services/api/rfq'
import type { RFQCreatePayload } from '@/types/rfq'
import { toast } from '@/lib/toast'
import { useUIStore } from '@/state/useUIStore'

export function useSubmitRFQ() {
  const openModal = useUIStore((s) => s.openModal)
  return useMutation({
    mutationFn: (data: RFQCreatePayload) => submitRFQ(data),
    onSuccess: () => {
      toast.success('RFQ submitted')
      openModal('rfq-confirm')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'RFQ submission failed'
      toast.error(message)
    },
  })
}
