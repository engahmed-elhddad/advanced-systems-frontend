import { api } from '@/lib/api'
import type { Product, Brand, Category, ProductListParams, ProductListResponse } from '@/types/product'

interface RawListResponse {
  items?: Product[]
  products?: Product[]
  results?: Product[]
  /** Meilisearch-style payload */
  hits?: Product[]
  total?: number
  pages?: number
  page?: number
  size?: number
  storefront?: ProductListResponse['storefront']
}

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page ?? 1))
  sp.set('size', String(params.size ?? 24))
  const sortRaw = (params.sort || 'relevance').toLowerCase()
  const sort =
    sortRaw === 'popular' || sortRaw === 'newest' || sortRaw === 'relevance' ? sortRaw : 'relevance'
  sp.set('sort', sort)
  if (params.search?.trim()) sp.set('q', params.search.trim())
  if (params.brand?.trim()) sp.set('brand', params.brand.trim())
  if (params.category?.trim()) sp.set('category', params.category.trim())
  const qs = sp.toString()
  const res = await api.get<RawListResponse>(`/api/v1/search/${qs ? `?${qs}` : ''}`)
  const d = res.data
  const items = d.items ?? d.products ?? d.results ?? d.hits ?? []
  return {
    items,
    products: items,
    results: items,
    total: d.total ?? items.length,
    pages: d.pages ?? 1,
    page: d.page ?? (params.page ?? 1),
    size: d.size ?? (params.size ?? 24),
    storefront: d.storefront,
  }
}

export async function getProductByPartNumber(partNumber: string): Promise<Product> {
  const normalized = partNumber.trim()
  const res = await api.get<Product>(`/api/v1/products/${encodeURIComponent(normalized)}`)
  return res.data
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
