import { useQuery } from '@tanstack/react-query'
import * as productService from '@/services/productService'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    staleTime: 600_000,
  })
}
