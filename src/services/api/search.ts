import type { SearchHit, SearchResponse, SearchSuggestionHit } from '@/types/search'
import type { ApiResult } from '@/types/api'
import { apiClient } from './client'

export async function searchProducts(
  query: string,
  filters?: Record<string, string | number | boolean | undefined>
): ApiResult<SearchResponse> {
  return apiClient.get<SearchResponse>('/api/v1/search/', {
    params: { q: query, ...filters },
  })
}

export async function getSearchSuggestions(query: string): ApiResult<SearchSuggestionHit[]> {
  if (query.length < 2) return []
  const data = await apiClient.get<{ suggestions?: SearchSuggestionHit[] }>(
    '/api/v1/search/autocomplete',
    { params: { q: query } }
  )
  return data.suggestions ?? []
}

export const search = searchProducts
export const getSuggestions = getSearchSuggestions

export function normalizeSearchHits(res: SearchResponse): SearchHit[] {
  if (res.hits.length > 0) return res.hits
  if (res.items.length > 0) return res.items
  return res.products
}
