import { useProducts } from './useProducts'
import { useSearch } from './useSearch'
import type { Product } from '@/types/product'

interface UseProductSearchParams {
  q?: string
  page?: number
  size?: number
  brand?: string
  category?: string
  sort?: string
}

export function useProductSearch(params: UseProductSearchParams) {
  const hasQuery = (params.q ?? '').trim().length >= 2

  const productsResult = useProducts({
    page: params.page,
    size: params.size,
    brand: params.brand,
    category: params.category,
    sort: params.sort,
  })

  const searchResult = useSearch({
    q: params.q ?? '',
    page: params.page,
    size: params.size,
    brand: params.brand,
    category: params.category,
    sort: params.sort,
  })

  if (hasQuery) {
    return {
      products: searchResult.hits as Product[],
      total: searchResult.total,
      pages: Math.ceil(searchResult.total / (params.size ?? 20)) || 1,
      isLoading: searchResult.isLoading,
      isError: searchResult.isError,
      refetch: () => {},
    }
  }

  return {
    products: productsResult.products as Product[],
    total: productsResult.total,
    pages: productsResult.pages,
    isLoading: productsResult.isLoading,
    isError: productsResult.isError,
    refetch: productsResult.refetch,
  }
}
