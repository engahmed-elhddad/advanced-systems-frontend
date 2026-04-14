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

/**
 * Total count for the same catalog slice as `/api/v1/products/` (via dedicated count endpoint).
 * Falls back to a minimal list request only if the count route is unavailable.
 */
async function fetchCatalogListedTotal(): Promise<number> {
  try {
    const res = await api.get<{ total?: number }>('/api/v1/products/catalog-count')
    return Number(res.data?.total ?? 0)
  } catch {
    try {
      const res = await api.get<{ total?: number }>('/api/v1/search/', { params: { page: 1, size: 1, sort: 'newest' } })
      return Number(res.data?.total ?? 0)
    } catch {
      return 0
    }
  }
}

async function fetchDashboardKpis(): Promise<AdminDashboardKpis> {
  const [data, catalogTotal] = await Promise.all([
    requestFirstSuccess<any>(['/api/v1/admin/dashboard']),
    fetchCatalogListedTotal(),
  ])

  const source = data?.stats ?? data ?? {}
  const dashboardTotal = Number(source.total_products ?? 0)
  const activeProducts = Number(source.active_products ?? source.total_products ?? 0)

  return {
    totalProducts: catalogTotal > 0 ? catalogTotal : dashboardTotal,
    activeProducts,
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

export type CatalogReadinessSummary = {
  active_approved_count: number
  storefront_ready_count: number
  not_storefront_ready_count: number
  missing_brand: number
  missing_category: number
  missing_description: number
  missing_images: number
}

export function useCatalogReadinessSummary() {
  return useQuery({
    queryKey: ['admin-catalog-readiness'],
    queryFn: async () => {
      const { data } = await api.get<CatalogReadinessSummary>('/api/v1/admin/catalog/readiness-summary')
      return data
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}
