import { useQuery } from '@tanstack/react-query'
import * as productService from '@/features/products/services'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    staleTime: 600_000,
  })
}
