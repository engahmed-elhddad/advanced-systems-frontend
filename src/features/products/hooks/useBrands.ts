import { useQuery } from '@tanstack/react-query'
import * as productService from '@/features/products/services'

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: productService.getBrands,
    staleTime: 600_000,
  })
}
