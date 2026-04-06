import { useQuery } from '@tanstack/react-query'
import * as productService from '@/services/productService'
import type { Product, SearchParams } from '@/types/product'

export function useSearch(params: SearchParams) {
  const enabled = (params.q ?? '').trim().length >= 2

  const query = useQuery({
    queryKey: ['search', params],
    queryFn: () => productService.searchProducts(params),
    enabled,
    staleTime: 10_000,
  })

  return {
    hits: (query.data?.hits ?? []) as Product[],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  }
}
