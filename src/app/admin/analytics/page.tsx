"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { Activity, BarChart3, ClipboardList, MousePointerClick, RefreshCw, TrendingUp, Users } from "lucide-react"
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/lib/admin-api"
import { Button, Card, Skeleton } from "@/components/ui"

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
    <Card hover className="p-0" padding="none">
      <div className="p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
          <Icon className="h-4 w-4 text-orange-300/75" />
          {label}
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
      </div>
    </Card>
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
    () =>
      (summary?.quote_clicks || 0) +
      (summary?.whatsapp_clicks || 0) +
      (summary?.rfq_submits || 0),
    [summary]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Behavior Analytics</h1>
          <p className="mt-1 text-sm text-white/55">Live visits, product interest, and lead conversion metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white backdrop-blur-xl transition-all duration-300 focus:border-orange-400/40 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          >
            <option value={7} className="bg-[#0c1428] text-white">
              Last 7 days
            </option>
            <option value={14} className="bg-[#0c1428] text-white">
              Last 14 days
            </option>
            <option value={30} className="bg-[#0c1428] text-white">
              Last 30 days
            </option>
          </select>
          <Button type="button" variant="secondary" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load}>
            Refresh
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin">Back</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur-xl">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          label="Unique visitors"
          value={loading ? "…" : String(summary?.unique_visitors ?? 0)}
          icon={Users}
        />
        <KpiCard
          label="RFQs (period)"
          value={loading ? "…" : String(summary?.total_rfqs_period ?? 0)}
          icon={ClipboardList}
        />
        <KpiCard
          label="RFQ conversion"
          value={
            loading
              ? "…"
              : `${(((summary?.rfq_conversion_rate || 0) * 100).toFixed(2))}%`
          }
          icon={BarChart3}
        />
        <KpiCard label="Visit events (legacy)" value={loading ? "…" : String(summary?.total_visits ?? 0)} icon={TrendingUp} />
        <KpiCard label="Product Views" value={loading ? "…" : String(summary?.product_views ?? 0)} icon={Activity} />
        <KpiCard label="Lead signals" value={loading ? "…" : String(leads)} icon={MousePointerClick} />
      </div>

      <Card hover={false} className="p-0" padding="none">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily funnel</h2>
              <p className="text-sm text-white/50">
                Unique visitors & RFQs from first-party tracking; legacy visit/lead lines from older event stream
              </p>
            </div>
            <div className="text-right text-sm text-white/55">
              <p>
                Total Leads: <span className="font-semibold text-white">{leads}</span>
              </p>
              <p>
                RFQ Submits: <span className="font-semibold text-white">{summary?.rfq_submits ?? 0}</span>
              </p>
              <p>
                WhatsApp Clicks: <span className="font-semibold text-white">{summary?.whatsapp_clicks ?? 0}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="h-[320px] w-full p-4">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl bg-white/10" />
          ) : (
            <AnalyticsTrendsChart data={summary?.daily || []} />
          )}
        </div>
      </Card>
    </div>
  )
}
