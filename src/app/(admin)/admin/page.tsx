"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Activity, Database, Package, UploadCloud } from "lucide-react"
import { Card, Skeleton } from "@/components/ui"
import { useDashboard } from "@/hooks/useDashboard"
import toast from "react-hot-toast"

export default function AdminDashboard() {
  const dashboardQuery = useDashboard()
  const kpis = dashboardQuery.data

  useEffect(() => {
    if (dashboardQuery.isError) {
      toast.error("Failed to load dashboard KPIs")
    }
  }, [dashboardQuery.isError])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-title">Dashboard</h1>
        <p className="admin-subtitle">Quick overview of products and recent activity.</p>
      </div>

      {dashboardQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load dashboard KPIs.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="admin-card">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500"><Package className="admin-icon" /> Total Products</p>
          {dashboardQuery.isLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-slate-900">{(kpis?.totalProducts ?? 0).toLocaleString()}</p>
          )}
        </Card>
        <Card className="admin-card">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500"><Activity className="admin-icon" /> System Status</p>
          {dashboardQuery.isLoading ? (
            <Skeleton className="mt-2 h-5 w-28" />
          ) : (
            <p className="admin-kpi-success mt-2 text-sm font-medium">healthy</p>
          )}
        </Card>
        <Card className="admin-card">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500"><Database className="admin-icon" /> Quick Actions</p>
          <div className="mt-2 flex gap-2">
            <Link href="/admin/products" className="admin-btn-primary !px-3 !py-1.5 text-xs">Products</Link>
            <Link href="/admin/upload" className="admin-btn-secondary !px-3 !py-1.5 text-xs"><UploadCloud className="admin-icon" /> Upload CSV</Link>
          </div>
        </Card>
      </div>

      <div className="admin-card !p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">KPI Snapshot</h2>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardQuery.isLoading ? (
            <>
              <Skeleton className="h-20 w-full bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10" />
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Active Products</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{kpis?.activeProducts ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Total RFQs</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{kpis?.totalRfqs ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Pending RFQs</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{kpis?.pendingRfqs ?? 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Brands / Categories</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {kpis?.totalBrands ?? 0} / {kpis?.totalCategories ?? 0}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
