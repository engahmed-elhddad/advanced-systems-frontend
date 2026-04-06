'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api/client'

export interface AdminStatsResponse {
  stats: {
    total_products: number
    total_rfqs: number
    pending_rfqs: number
    total_suppliers: number
    total_brands: number
    total_categories: number
  }
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get<AdminStatsResponse>('/api/v1/admin/dashboard'),
  })
}
