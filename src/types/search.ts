export interface SearchHit {
  part_number: string
  name?: string
  brand?: string
  brand_name?: string
  category?: string
  category_name?: string
  description?: string
  image_url?: string
  slug?: string
}

export interface SearchResponse {
  hits: SearchHit[]
  items: SearchHit[]
  products: SearchHit[]
  total: number
  pages: number
  page: number
  size: number
  query: string
}

export interface SearchSuggestionHit {
  id?: number
  part_number?: string
  name?: string
  brand_name?: string
  image_url?: string
  /** @deprecated Prefer image_url */
  primary_image?: string
  slug?: string
}
