'use client'

import { useQuery } from '@tanstack/react-query'
import { searchProducts } from '@/services/api/search'

export function useSearch(
  query: string,
  filters?: Record<string, string | number | boolean | undefined>
) {
  const q = query.trim()
  return useQuery({
    queryKey: ['search', q, filters],
    queryFn: () => searchProducts(q, filters),
    enabled: q.length >= 2,
  })
}
