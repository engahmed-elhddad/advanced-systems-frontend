'use client'

import { useQuery } from '@tanstack/react-query'
import { getProductBySlug } from '@/services/api/products'

export function useProductDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug as string),
    enabled: Boolean(slug && slug.length > 0),
  })
}
