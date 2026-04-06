export type { ProductListParams, Product } from '@/types/product'

export interface ProductListFilters {
  brand_id?: number
  category_id?: number
  q?: string
  page: number
  size: number
}
