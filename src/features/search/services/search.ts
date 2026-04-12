import { api } from '@/lib/api'
import { normalizeCategoryQueryForApi } from '@/lib/constants'
import type { Product, SearchParams, SearchResponse } from '@/types/product'

interface RawSearchResponse {
  hits?: Product[]
  items?: Product[]
  products?: Product[]
  total?: number
  estimatedTotalHits?: number
  pages?: number
  page?: number
  size?: number
  query?: string
  processingTimeMs?: number
}

export interface BrowseSearchParams {
  q?: string
  page?: number
  size?: number
  brand_ids?: number[]
  category_ids?: number[]
  series_values?: string[]
  availability_in?: string[]
  spec?: string[]
  sort?: 'relevance' | 'newest' | 'popular' | string
}

/** Multi-filter browse (Meilisearch; spec filters use database path on API). */
export async function searchBrowse(params: BrowseSearchParams): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  const q = (params.q ?? '').trim()
  if (q) sp.set('q', q)
  sp.set('page', String(params.page ?? 1))
  sp.set('size', String(params.size ?? 30))
  sp.set('sort', params.sort ?? 'relevance')
  for (const id of params.brand_ids ?? []) {
    sp.append('brand_ids', String(id))
  }
  for (const id of params.category_ids ?? []) {
    sp.append('category_ids', String(id))
  }
  for (const s of params.series_values ?? []) {
    if (s.trim()) sp.append('series_values', s)
  }
  for (const a of params.availability_in ?? []) {
    if (a.trim()) sp.append('availability_in', a)
  }
  for (const spec of params.spec ?? []) {
    if (spec.includes(':')) sp.append('spec', spec)
  }
  const qs = sp.toString()
  const res = await api.get<RawSearchResponse>(`/api/v1/search/${qs ? `?${qs}` : ''}`)
  const d = res.data
  const hits = d.hits ?? d.items ?? d.products ?? []
  return {
    hits,
    items: hits,
    products: hits,
    total: d.total ?? d.estimatedTotalHits ?? hits.length,
    estimatedTotalHits: d.estimatedTotalHits,
    pages: d.pages ?? 1,
    page: d.page ?? (params.page ?? 1),
    size: d.size ?? (params.size ?? 30),
    query: d.query ?? q,
    processingTimeMs: d.processingTimeMs,
  }
}

export interface BrowseFacetsPayload {
  series: string[]
  specs: Record<string, string[]>
}

export async function getBrowseFacets(): Promise<BrowseFacetsPayload> {
  const { data } = await api.get<BrowseFacetsPayload>('/api/v1/search/browse-facets')
  return data
}

export async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  const query: Record<string, string | number> = {
    q: params.q,
    page: params.page ?? 1,
    size: params.size ?? 20,
  }
  if (params.brand) query.brand = params.brand
  if (params.category) {
    const slug = normalizeCategoryQueryForApi(params.category)
    if (slug) query.category = slug
  }
  if (params.sort) query.sort = params.sort

  const res = await api.get<RawSearchResponse>('/api/v1/search/', { params: query })
  const d = res.data
  const hits = d.hits ?? d.items ?? d.products ?? []
  return {
    hits,
    items: hits,
    products: hits,
    total: d.total ?? d.estimatedTotalHits ?? hits.length,
    estimatedTotalHits: d.estimatedTotalHits,
    pages: d.pages ?? 1,
    page: d.page ?? (params.page ?? 1),
    size: d.size ?? (params.size ?? 20),
    query: d.query ?? params.q,
    processingTimeMs: d.processingTimeMs,
  }
}
