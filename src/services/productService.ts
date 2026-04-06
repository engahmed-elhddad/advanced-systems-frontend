import { api } from '@/lib/api'
import { normalizeCategoryQueryForApi } from '@/app/lib/constants'
import type {
  Product,
  Brand,
  Category,
  ProductListParams,
  ProductListResponse,
  SearchParams,
  SearchResponse,
} from '@/types/product'

interface RawListResponse {
  items?: Product[]
  products?: Product[]
  results?: Product[]
  total?: number
  pages?: number
  page?: number
  size?: number
}

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    size: params.size ?? 24,
  }
  if (params.brand) query.brand = params.brand.trim().toLowerCase()
  if (params.category) query.category = params.category.trim().toLowerCase()
  if (params.sort) query.sort = params.sort
  if (params.search) query.search = params.search.trim()
  if (params.include_unready != null) query.include_unready = params.include_unready

  const res = await api.get<RawListResponse>('/api/v1/products/', { params: query })
  const d = res.data
  const items = d.items ?? d.products ?? d.results ?? []
  return {
    items,
    products: items,
    results: items,
    total: d.total ?? items.length,
    pages: d.pages ?? 1,
    page: d.page ?? (params.page ?? 1),
    size: d.size ?? (params.size ?? 24),
  }
}

export async function getProductByPartNumber(partNumber: string): Promise<Product> {
  const normalized = partNumber.trim()
  const res = await api.get<Product>(`/api/v1/products/${encodeURIComponent(normalized)}`)
  return res.data
}

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

export async function getBrands(): Promise<Brand[]> {
  const res = await api.get<Brand[] | { brands: Brand[] }>('/api/v1/brands/')
  const data = res.data
  return Array.isArray(data) ? data : (data.brands ?? [])
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[] | { categories: Category[] }>('/api/v1/categories/')
  const data = res.data
  return Array.isArray(data) ? data : (data.categories ?? [])
}
