export interface Product {
  id: number
  part_number: string
  slug?: string
  name?: string
  description?: string
  series?: string
  brand?: string
  brand_text?: string
  category?: string
  category_text?: string
  image_url?: string
  images?: Array<{ url?: string; thumbnail_url?: string; is_primary?: boolean; id?: string }>
  specifications?: string | Record<string, unknown>
  specs?: Record<string, unknown>
  price?: number
  price_usd?: number
  is_enriched?: boolean
  is_featured?: boolean
  is_ready?: boolean
  availability?: string
  stock_quantity?: number
  ingestion_status?: string
  datasheet_url?: string
  brand_logo_url?: string
  main_image_url?: string
  side_image_url?: string
  label_image_url?: string
  box_image_url?: string
  created_at?: string
  updated_at?: string
}

export interface Brand {
  id: number
  name: string
  slug?: string
  product_count?: number
  logo_url?: string | null
}

export interface Category {
  id: number
  name: string
  slug?: string
  product_count?: number
}

export interface ProductListParams {
  page?: number
  size?: number
  brand?: string
  category?: string
  sort?: string
  search?: string
  include_unready?: boolean
}

export interface ProductListResponse {
  items: Product[]
  products: Product[]
  results: Product[]
  total: number
  pages: number
  page: number
  size: number
  storefront?: {
    storefront_relaxed?: boolean
    total_before_publish_ready?: number
    total_after_publish_ready?: number
  }
}

export interface SearchParams {
  q: string
  brand?: string
  category?: string
  page?: number
  size?: number
  sort?: string
}

export interface SearchResponse {
  hits: Product[]
  items: Product[]
  products: Product[]
  total: number
  estimatedTotalHits?: number
  pages: number
  page: number
  size: number
  query: string
  /** Server spell / casing hint when the query returned no hits. */
  did_you_mean?: string | null
  processingTimeMs?: number
  storefront?: {
    storefront_relaxed?: boolean
    total_before_publish_ready?: number
    total_after_publish_ready?: number
  }
}

/** Alias for backward compat with features/ layer */
export type ProductListItem = Product
export type ProductDetail = Product
