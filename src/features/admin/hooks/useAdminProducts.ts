'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminListProducts } from '@/services/api/admin'

export function useAdminProducts(params: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => adminListProducts(params),
  })
}

export function useInvalidateAdminProducts() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ['admin-products'] })
}
