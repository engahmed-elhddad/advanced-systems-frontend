import type { ApiResult, PaginatedResponse } from '@/types/api'
import type { ProductDetail, ProductListItem } from '@/types/product'
import { apiClient } from './client'

export interface ProductListParams {
  page?: number
  size?: number
  brand_id?: number
  category_id?: number
  brand?: string
  category?: string
  search?: string
  include_unready?: boolean
}

export async function getProducts(
  params: ProductListParams
): ApiResult<PaginatedResponse<ProductListItem>> {
  return apiClient.get<PaginatedResponse<ProductListItem>>('/api/v1/products/', {
    params,
  })
}

export async function getProduct(slug: string): ApiResult<ProductDetail> {
  return apiClient.get<ProductDetail>(
    `/api/v1/products/part/${encodeURIComponent(slug)}`
  )
}

export async function getProductFilters(): ApiResult<{
  brands: { id: number; name: string }[]
  categories: { id: number; name: string }[]
}> {
  const [brandsRes, catsRes] = await Promise.all([
    apiClient.get<{ id: number; name: string }[]>('/api/v1/brands/').catch(() => []),
    apiClient.get<{ id: number; name: string }[]>('/api/v1/categories/').catch(() => []),
  ])
  return {
    brands: Array.isArray(brandsRes) ? brandsRes : [],
    categories: Array.isArray(catsRes) ? catsRes : [],
  }
}

export const getProductBySlug = getProduct
export const getFilters = getProductFilters
