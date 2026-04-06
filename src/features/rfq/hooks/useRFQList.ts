'use client'

import { useQuery } from '@tanstack/react-query'
import { getRFQList } from '@/services/api/rfq'

export function useRFQList(params: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ['rfqs', params],
    queryFn: () => getRFQList(params),
  })
}
