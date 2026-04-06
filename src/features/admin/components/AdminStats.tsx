'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api/client'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBanner } from '@/components/shared/ErrorBanner'

interface DashboardPayload {
  stats: {
    total_products: number
    total_rfqs: number
    pending_rfqs: number
    total_suppliers: number
    total_brands: number
    total_categories: number
  }
}

export function AdminStats() {
  const q = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get<DashboardPayload>('/api/v1/admin/dashboard'),
  })

  if (q.isError) {
    return (
      <ErrorBanner
        message={q.error instanceof Error ? q.error.message : 'Failed to load stats'}
        onRetry={() => void q.refetch()}
      />
    )
  }

  if (q.isLoading || !q.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={96} className="w-full" />
        ))}
      </div>
    )
  }

  const { stats } = q.data
  const items = [
    { label: 'Products', value: stats.total_products },
    { label: 'RFQs', value: stats.total_rfqs },
    { label: 'Pending RFQs', value: stats.pending_rfqs },
    { label: 'Suppliers', value: stats.total_suppliers },
    { label: 'Brands', value: stats.total_brands },
    { label: 'Categories', value: stats.total_categories },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} variant="bordered" padding="md">
          <p className="text-sm text-[var(--color-foreground-muted)]">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{item.value}</p>
        </Card>
      ))}
    </div>
  )
}
