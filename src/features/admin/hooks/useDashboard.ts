import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type AdminDashboardKpis = {
  totalProducts: number
  activeProducts: number
  totalRfqs: number
  pendingRfqs: number
  totalBrands: number
  totalCategories: number
}

async function requestFirstSuccess<T>(paths: string[]): Promise<T> {
  let lastErr: unknown = null
  for (const path of paths) {
    try {
      const res = await api.get<T>(path)
      return res.data
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

async function fetchDashboardKpis(): Promise<AdminDashboardKpis> {
  const data = await requestFirstSuccess<any>([
    '/api/v1/admin/b2b/dashboard',
    '/api/v1/admin/dashboard',
  ])

  const source = data?.stats ?? data ?? {}
  return {
    totalProducts: Number(source.total_products ?? 0),
    activeProducts: Number(source.active_products ?? source.total_products ?? 0),
    totalRfqs: Number(source.total_rfqs ?? 0),
    pendingRfqs: Number(source.pending_rfqs ?? 0),
    totalBrands: Number(source.total_brands ?? 0),
    totalCategories: Number(source.total_categories ?? 0),
  }
}

export function useDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardKpis,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
