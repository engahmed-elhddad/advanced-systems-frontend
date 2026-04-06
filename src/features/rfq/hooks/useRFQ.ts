'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitRFQ } from '@/services/api/rfq'
import type { RFQCreatePayload } from '@/types/rfq'

export function useRFQ() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RFQCreatePayload) => submitRFQ(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
}
