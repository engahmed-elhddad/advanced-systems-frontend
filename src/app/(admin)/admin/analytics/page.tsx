"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { Activity, BarChart3, MessageSquare, MousePointerClick, RefreshCw, Users } from "lucide-react"
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/lib/admin-api"
import { Skeleton } from "@/components/ui"

const AnalyticsTrendsChart = dynamic(
  () => import("./_components/AnalyticsTrendsChart").then((m) => m.AnalyticsTrendsChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full bg-white/10" />,
  }
)

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="admin-card">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
        <Icon className="admin-icon" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)

  async function load() {
    setLoading(true)
    setError("")
    const res = await fetchAnalyticsSummary(days)
    if (!res.ok) {
      setError(res.message || "Failed to load analytics summary")
      setSummary(null)
      setLoading(false)
      return
    }
    setSummary(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const leads = useMemo(
    () => (summary?.quote_clicks || 0) + (summary?.whatsapp_clicks || 0),
    [summary]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-title">Behavior Analytics</h1>
          <p className="admin-subtitle">Live visits, product interest, and lead conversion metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button onClick={load} className="admin-btn-secondary">
            <RefreshCw className="admin-icon" />
            Refresh
          </button>
          <Link href="/admin" className="admin-btn-secondary">
            Back
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Visits"
          value={loading ? "..." : String(summary?.total_visits ?? 0)}
          icon={Users}
        />
        <KpiCard
          label="Product Views"
          value={loading ? "..." : String(summary?.product_views ?? 0)}
          icon={Activity}
        />
        <KpiCard
          label="Leads"
          value={loading ? "..." : String(leads)}
          icon={MousePointerClick}
        />
        <KpiCard
          label="Quote Clicks"
          value={loading ? "..." : String(summary?.quote_clicks ?? 0)}
          icon={MessageSquare}
        />
        <KpiCard
          label="Conversion Rate"
          value={loading ? "..." : `${(((summary?.conversion_rate || 0) * 100).toFixed(2))}%`}
          icon={BarChart3}
        />
      </div>

      <div className="admin-card-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Daily Visits vs Leads</h2>
            <p className="text-sm text-slate-500">Leads = quote clicks + WhatsApp clicks</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>
              Total Leads: <span className="font-semibold text-slate-900">{leads}</span>
            </p>
            <p>
              WhatsApp Clicks:{" "}
              <span className="font-semibold text-slate-900">{summary?.whatsapp_clicks ?? 0}</span>
            </p>
          </div>
        </div>
        <div className="h-[320px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full bg-white/10" />
          ) : (
            <AnalyticsTrendsChart data={summary?.daily || []} />
          )}
        </div>
      </div>
    </div>
  )
}
