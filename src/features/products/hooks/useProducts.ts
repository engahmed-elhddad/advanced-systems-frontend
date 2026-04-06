'use client'

import { useQuery } from '@tanstack/react-query'
import { getProducts, type ProductListParams } from '@/services/api/products'

export function useProducts(params: ProductListParams) {
  const q = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  })
  return {
    products: q.data?.items ?? [],
    total: q.data?.total ?? 0,
    pages: q.data?.pages ?? 0,
    page: q.data?.page ?? params.page ?? 1,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  }
}
