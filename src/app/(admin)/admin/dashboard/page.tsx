'use client'

import { RefreshCw, DollarSign, ShoppingCart, FileText, AlertCircle } from 'lucide-react'
import { useDashboard } from './_hooks/useDashboard'
import { KpiCard } from './_components/KpiCard'
import { RecentQuotations, RecentOrders, RecentInvoices } from './_components/RecentActivityList'
import { AlertsPanel } from './_components/AlertsPanel'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Error banner ───────────────────────────────────────────────────────────────

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        Could not load dashboard data — the B2B dashboard API endpoint may not be deployed yet.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="ml-4 flex-shrink-0 rounded-[2px] border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
      {title}
    </h2>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function B2BDashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()

  const kpis = data?.kpis
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">B2B Operations Dashboard</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Revenue, orders, quotations, and alerts at a glance
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          aria-label="Refresh dashboard"
          className="flex items-center gap-1.5 rounded-[2px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {isError && <ErrorBanner onRetry={() => refetch()} />}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="kpi-section">
        <SectionHeader title="Key metrics" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Revenue today"
            value={kpis ? formatCurrency(kpis.revenue_today) : '—'}
            sublabel={`${monthName}: ${kpis ? formatCurrency(kpis.revenue_month) : '—'}`}
            icon={DollarSign}
            variant="success"
            loading={isLoading}
          />
          <KpiCard
            label="Active orders"
            value={kpis?.active_orders ?? '—'}
            sublabel="Status: pending"
            icon={ShoppingCart}
            variant={
              kpis && kpis.active_orders > 10
                ? 'warning'
                : 'default'
            }
            loading={isLoading}
          />
          <KpiCard
            label="Unpaid invoices"
            value={kpis?.unpaid_invoices ?? '—'}
            sublabel="Issued but not paid"
            icon={FileText}
            variant={
              kpis && kpis.unpaid_invoices > 5
                ? 'warning'
                : 'default'
            }
            loading={isLoading}
          />
          <KpiCard
            label="Low stock items"
            value={kpis?.low_stock_products ?? '—'}
            sublabel="Below safety threshold"
            icon={AlertCircle}
            variant={
              kpis && kpis.low_stock_products > 0
                ? 'danger'
                : 'default'
            }
            loading={isLoading}
          />
        </div>
      </section>

      {/* ── Alerts ────────────────────────────────────────────────────────── */}
      <section aria-label="Alerts">
        <SectionHeader title="Alerts requiring attention" />
        <div className="mt-3">
          <AlertsPanel alerts={data?.alerts} loading={isLoading} />
        </div>
      </section>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <section aria-label="Recent activity">
        <SectionHeader title="Recent activity" />
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <RecentQuotations
            items={data?.recent_quotations ?? []}
            loading={isLoading}
          />
          <RecentOrders
            items={data?.recent_orders ?? []}
            loading={isLoading}
          />
          <RecentInvoices
            items={data?.recent_invoices ?? []}
            loading={isLoading}
          />
        </div>
      </section>

    </div>
  )
}
