"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Activity, Database, Package, RefreshCw, UploadCloud } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Skeleton } from "@/components/ui"
import { useDashboard, useCatalogReadinessSummary } from '@/features/admin/hooks/useDashboard'
import { api } from '@/lib/api'
import toast from "react-hot-toast"

const glassTile =
  "rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.07] hover:shadow-lg hover:shadow-orange-500/10"

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const dashboardQuery = useDashboard()
  const readinessQuery = useCatalogReadinessSummary()
  const kpis = dashboardQuery.data
  const readiness = readinessQuery.data

  const reindexMutation = useMutation({
    mutationFn: () => api.post('/api/v1/admin/search/reindex'),
    onSuccess: (res) => {
      const msg =
        typeof res.data?.message === 'string' ? res.data.message : 'Search reindex job accepted.'
      toast.success(
        `${msg} Large catalogs may take several minutes; refresh the product list or try a search shortly.`,
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: () => toast.error('Reindex failed'),
  })

  const runReindex = () => {
    if (
      !window.confirm(
        'Rebuild the full product search index? This can take several minutes on large catalogs and increases load on the server.',
      )
    ) {
      return
    }
    reindexMutation.mutate()
  }

  useEffect(() => {
    if (dashboardQuery.isError) {
      toast.error("Failed to load dashboard KPIs")
    }
  }, [dashboardQuery.isError])

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/55">
          Quick overview — public catalog count matches storefront-ready products (search index and PDPs use the same rules).
        </p>
      </div>

      {dashboardQuery.isError && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur-xl shadow-[0_0_24px_rgba(239,68,68,0.15)]">
          Failed to load dashboard KPIs.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover className="p-0" padding="none">
          <div className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
              <Package className="h-4 w-4 text-orange-300/80" />
              Total Products
            </p>
            {dashboardQuery.isLoading ? (
              <Skeleton className="mt-3 h-9 w-28 rounded-lg bg-white/10" />
            ) : (
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">
                {(kpis?.totalProducts ?? 0).toLocaleString()}
              </p>
            )}
          </div>
        </Card>
        <Card hover className="p-0" padding="none">
          <div className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
              <Activity className="h-4 w-4 text-emerald-300/80" />
              System Status
            </p>
            {dashboardQuery.isLoading ? (
              <Skeleton className="mt-3 h-6 w-32 rounded-lg bg-white/10" />
            ) : (
              <p className="mt-3 text-lg font-semibold text-emerald-300">
                {dashboardQuery.isFetching ? 'Refreshing…' : 'Healthy'}
              </p>
            )}
          </div>
        </Card>
        <Card hover className="p-0" padding="none">
          <div className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
              <Database className="h-4 w-4 text-violet-300/80" />
              Quick Actions
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href="/admin/products">Products</Link>
              </Button>
              <Button asChild size="sm" variant="secondary" leftIcon={<UploadCloud className="h-3.5 w-3.5" />}>
                <Link href="/admin/upload">Upload CSV</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card hover={false} className="p-0" padding="none" header="Catalog readiness">
        <div className="space-y-3 p-4 lg:p-5">
          {readinessQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
          ) : readinessQuery.isError ? (
            <p className="text-sm text-amber-200/90">Could not load readiness summary (admin session required).</p>
          ) : (
            <>
              <p className="text-sm text-white/55">
                Active + approved products: <span className="font-semibold text-white">{readiness?.active_approved_count ?? 0}</span>
                {' · '}
                Storefront-ready: <span className="font-semibold text-emerald-200">{readiness?.storefront_ready_count ?? 0}</span>
                {(readiness?.not_storefront_ready_count ?? 0) > 0 ? (
                  <span className="text-amber-200">
                    {' '}
                    ({readiness?.not_storefront_ready_count} not yet publishable)
                  </span>
                ) : null}
              </p>
              <ul className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                <li>
                  <Link
                    href="/admin/products?missing_brand=1"
                    className="rounded-md px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                  >
                    Missing brand: <span className="font-semibold text-white">{readiness?.missing_brand ?? 0}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/products?missing_category=1"
                    className="rounded-md px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                  >
                    Missing category: <span className="font-semibold text-white">{readiness?.missing_category ?? 0}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/products?missing_description=1"
                    className="rounded-md px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                  >
                    Missing description: <span className="font-semibold text-white">{readiness?.missing_description ?? 0}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/products?missing_images=1"
                    className="rounded-md px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                  >
                    Missing images: <span className="font-semibold text-white">{readiness?.missing_images ?? 0}</span>
                  </Link>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/admin/products">Fix in products</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />}
                  disabled={reindexMutation.isPending}
                  onClick={runReindex}
                >
                  Rebuild search index
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card hover={false} className="p-0" padding="none" header="KPI Snapshot">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
          {dashboardQuery.isLoading ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
              <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
              <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
              <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
            </>
          ) : (
            <>
              <div className={glassTile}>
                <p className="text-xs font-medium text-white/45">Active Products</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-white">{kpis?.activeProducts ?? 0}</p>
              </div>
              <div className={glassTile}>
                <p className="text-xs font-medium text-white/45">Total RFQs</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-white">{kpis?.totalRfqs ?? 0}</p>
              </div>
              <div className={glassTile}>
                <p className="text-xs font-medium text-white/45">Pending RFQs</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-white">{kpis?.pendingRfqs ?? 0}</p>
              </div>
              <div className={glassTile}>
                <p className="text-xs font-medium text-white/45">Brands / Categories</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                  {kpis?.totalBrands ?? 0} / {kpis?.totalCategories ?? 0}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
