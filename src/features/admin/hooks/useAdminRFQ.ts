'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUpdateRFQ } from '@/services/api/admin'

export function useAdminRFQUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number
      body: Partial<{ status: string; quoted_price_usd: number; lead_time: string; admin_notes: string }>
    }) => adminUpdateRFQ(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rfqs'] })
    },
  })
}
