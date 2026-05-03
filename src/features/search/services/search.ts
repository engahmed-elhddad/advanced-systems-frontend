import { api } from '@/lib/api'
import { normalizeCategoryQueryForApi } from '@/lib/constants'
import type { Facet } from '@/types/facet'
import type { Product, SearchParams, SearchResponse } from '@/types/product'

interface RawSearchResponse {
  hits?: Product[]
  items?: Product[]
  products?: Product[]
  facets?: Facet[]
  total?: number
  estimatedTotalHits?: number
  pages?: number
  page?: number
  size?: number
  query?: string
  did_you_mean?: string | null
  processingTimeMs?: number
  storefront?: {
    storefront_relaxed?: boolean
    total_before_publish_ready?: number
    total_after_publish_ready?: number
  }
}

export interface BrowseSearchParams {
  q?: string
  page?: number
  size?: number
  brand_ids?: number[]
  category_ids?: number[]
  series_values?: string[]
  /** Repeated ``availability`` query param (spec 012); merged with ``availability_in``. */
  availability?: string[]
  /** Legacy repeated param name — still sent for backward compat. */
  availability_in?: string[]
  condition?: string[]
  price_band?: string[]
  spec?: string[]
  facets?: boolean
  sort?:
    | 'relevance'
    | 'price_asc'
    | 'price_desc'
    | 'brand_az'
    | 'partnumber_az'
    | 'newest'
    | 'popular'
    | string
}

/** Multi-filter browse (Meilisearch; spec filters use database path on API). */
export async function searchBrowse(params: BrowseSearchParams): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  const q = (params.q ?? '').trim()
  if (q) sp.set('q', q)
  sp.set('page', String(params.page ?? 1))
  sp.set('size', String(params.size ?? 20))
  sp.set('sort', params.sort ?? 'relevance')
  for (const id of params.brand_ids ?? []) {
    sp.append('brand_id', String(id))
  }
  for (const id of params.category_ids ?? []) {
    sp.append('category_id', String(id))
  }
  for (const s of params.series_values ?? []) {
    if (s.trim()) sp.append('series_values', s)
  }
  const avail = [...(params.availability ?? []), ...(params.availability_in ?? [])]
  for (const a of avail) {
    if (a.trim()) sp.append('availability', a.trim())
  }
  for (const c of params.condition ?? []) {
    if (c.trim()) sp.append('condition', c.trim())
  }
  for (const pb of params.price_band ?? []) {
    if (pb.trim()) sp.append('price_band', pb.trim())
  }
  if (params.facets === true) {
    sp.set('facets', 'true')
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
    facets: d.facets,
    total: d.total ?? d.estimatedTotalHits ?? hits.length,
    estimatedTotalHits: d.estimatedTotalHits,
    pages: d.pages ?? 1,
    page: d.page ?? (params.page ?? 1),
    size: d.size ?? (params.size ?? 20),
    query: d.query ?? q,
    did_you_mean: d.did_you_mean ?? null,
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
    did_you_mean: d.did_you_mean ?? null,
    processingTimeMs: d.processingTimeMs,
    storefront: d.storefront,
  }
}
