/** Spec 012 — faceted search API shapes (`GET /api/v1/search?facets=true`). */

export interface FacetValue {
  value: number | string
  label: string
  count: number
}

export interface PriceBandFacetValue {
  value: string
  label_en: string
  label_egp?: string
  min_usd?: number | null
  max_usd?: number | null
  min_egp?: number | null
  max_egp?: number | null
  fx_rate?: number
  fx_fetched_at?: string
  count: number
}

export interface Facet {
  name: string
  label_en: string
  values: Array<FacetValue | PriceBandFacetValue>
}
