'use client'

import { useQuery } from '@tanstack/react-query'
import { getSearchSuggestions } from '@/services/api/search'

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['suggestions', query],
    queryFn: () => getSearchSuggestions(query),
    enabled: query.trim().length >= 1,
    staleTime: 30_000,
  })
}
