"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  Filter,
} from "lucide-react"
import {
  fetchAnalyticsInsights,
  fetchAnalyticsSummary,
  type AnalyticsAlert,
  type AnalyticsInsights,
  type AnalyticsRecommendation,
  type AnalyticsSummary,
} from "@/lib/admin-api"
import { Button, Card, Select, Skeleton } from "@/components/ui"

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

function RankTable({
  title,
  subtitle,
  icon: Icon,
  columns,
  rows,
  emptyHint,
}: {
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  columns: { key: string; label: string; align?: "left" | "right" }[]
  rows: Record<string, string | number>[]
  emptyHint: string
}) {
  return (
    <Card hover={false} className="p-0" padding="none">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Icon className="h-5 w-5 text-orange-300/80" />
          {title}
        </h2>
        <p className="mt-1 text-sm text-white/50">{subtitle}</p>
      </div>
      <div className="overflow-x-auto p-2 sm:p-4">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-white/45">{emptyHint}</p>
        ) : (
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-3 py-2 ${c.align === "right" ? "text-right tabular-nums" : ""}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.04]">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-2.5 text-white/90 ${c.align === "right" ? "text-right tabular-nums font-medium text-white" : ""}`}
                    >
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null)
  const [insightsError, setInsightsError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    setInsightsError("")
    const [sumRes, insRes] = await Promise.all([fetchAnalyticsSummary(days), fetchAnalyticsInsights(days, 25)])
    if (!sumRes.ok) {
      setError(sumRes.message || "Failed to load analytics summary")
      setSummary(null)
      setInsights(null)
      setLoading(false)
      return
    }
    setSummary(sumRes.data)
    if (!insRes.ok) {
      setInsightsError(insRes.message || "Failed to load audit insights")
      setInsights(null)
    } else {
      setInsights(insRes.data)
    }
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
          <div className="w-[200px]">
            <Select
              value={String(days)}
              onChange={(v) => setDays(Number(v))}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '14', label: 'Last 14 days' },
                { value: '30', label: 'Last 30 days' },
              ]}
              placeholder="Date range"
              triggerClassName="h-10"
            />
          </div>
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

      {insightsError ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 backdrop-blur-xl">
          {insightsError}
        </div>
      ) : null}

      {!loading && insights ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card hover={false} className="border border-white/10 bg-white/[0.04] p-0" padding="none">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <AlertTriangle className="h-5 w-5 text-amber-300/90" />
                Alerts & anomalies
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Rule-based flags from audit events (funnel, zero-result search, category demand, per-SKU engagement).
              </p>
            </div>
            <ul className="max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto p-4">
              {(insights.alerts ?? []).length === 0 ? (
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
                  No anomalies detected for this range. Lower traffic windows may not cross thresholds.
                </li>
              ) : (
                (insights.alerts as AnalyticsAlert[]).map((a) => (
                  <li
                    key={`${a.code}-${a.title}`}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      a.severity === "opportunity"
                        ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-50"
                        : "border-amber-500/35 bg-amber-950/20 text-amber-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {a.severity === "opportunity" ? (
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                      )}
                      <div>
                        <p className="font-semibold text-white">{a.title}</p>
                        <p className="mt-1 text-white/75">{a.detail}</p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card hover={false} className="border border-white/10 bg-white/[0.04] p-0" padding="none">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Lightbulb className="h-5 w-5 text-orange-300/90" />
                Recommended actions
              </h2>
              <p className="mt-1 text-sm text-white/50">Prioritized follow-ups derived from the same signals as alerts.</p>
            </div>
            <ul className="max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto p-4">
              {(insights.recommendations ?? []).length === 0 ? (
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
                  No recommendations for this window.
                </li>
              ) : (
                (insights.recommendations as AnalyticsRecommendation[]).map((r) => (
                  <li
                    key={`${r.code}-${r.title}`}
                    className="rounded-xl border border-orange-500/25 bg-orange-950/15 px-4 py-3 text-sm text-white/90"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-200/80">{r.priority}</p>
                    <p className="mt-1 font-semibold text-white">{r.title}</p>
                    <p className="mt-1 text-white/70">{r.detail}</p>
                  </li>
                ))
              )}
            </ul>
          </Card>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <RankTable
          title="Top search terms"
          subtitle="Normalized from first-party `search` events (audit stream)"
          icon={Search}
          columns={[
            { key: "rank", label: "#" },
            { key: "query", label: "Query" },
            { key: "count", label: "Searches", align: "right" },
          ]}
          rows={(insights?.top_search_queries ?? []).map((r, i) => ({
            rank: i + 1,
            query: r.query,
            count: r.count,
          }))}
          emptyHint="No search events in this period. Ensure analytics consent is accepted and tracking is enabled."
        />
        <RankTable
          title="Most viewed products"
          subtitle="Part numbers from `product_view` events"
          icon={Eye}
          columns={[
            { key: "rank", label: "#" },
            { key: "part_number", label: "Part number" },
            { key: "views", label: "Views", align: "right" },
          ]}
          rows={(insights?.top_viewed_products ?? []).map((r, i) => ({
            rank: i + 1,
            part_number: r.part_number,
            views: r.views,
          }))}
          emptyHint="No product views recorded. Open PDPs with tracking enabled to populate this list."
        />
      </div>

      <RankTable
        title="Top products clicked from search"
        subtitle="`click_product` where list_context indicates search results"
        icon={Filter}
        columns={[
          { key: "rank", label: "#" },
          { key: "part_number", label: "Part number" },
          { key: "clicks", label: "Clicks", align: "right" },
        ]}
        rows={(insights?.top_clicked_products_from_search ?? []).map((r, i) => ({
          rank: i + 1,
          part_number: r.part_number,
          clicks: r.clicks,
        }))}
        emptyHint="No search-result product clicks in range."
      />

      <Card hover={false} className="p-0" padding="none">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Drop-off funnel (PDP-scoped)</h2>
          <p className="mt-1 text-sm text-white/50">
            Among sessions with at least one <code className="text-orange-200/90">product_view</code>, each row shows
            how many distinct sessions also reached the next milestone. Retention % is always vs the PDP baseline;
            drop-off % is the complement (where users fell away vs that baseline).
          </p>
        </div>
        <div className="space-y-4 p-5">
          {loading || !insights ? (
            <Skeleton className="h-40 w-full rounded-xl bg-white/10" />
          ) : (
            insights.funnel_conditional_on_pdp.map((step, idx) => {
              const base = insights.funnel_conditional_on_pdp[0]?.distinct_sessions || 1
              const barPct = Math.min(100, Math.round((step.distinct_sessions / base) * 100))
              return (
                <div key={step.step_key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-white/90">{step.label}</span>
                    <span className="tabular-nums text-white/55">
                      {step.distinct_sessions} sessions
                      <span className="ml-2 text-white/35">·</span>
                      <span className="ml-2 text-emerald-200/90">{step.retention_vs_prior_pct}%</span>
                      <span className="ml-1 text-white/40">of PDP baseline</span>
                      {idx > 0 ? (
                        <span className="ml-2 text-rose-200/80">{step.drop_off_vs_prior_pct}% attrition</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500/90 to-amber-400/80 transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card hover={false} className="p-0" padding="none">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">RFQ conversion (audit + persisted)</h2>
          <p className="mt-1 text-sm text-white/50">
            Rates use distinct sessions with a PDP view as the denominator where noted. RFQ rows count submissions
            stored in the database for the same window.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading || !insights ? (
            <>
              <Skeleton className="h-24 rounded-xl bg-white/10" />
              <Skeleton className="h-24 rounded-xl bg-white/10" />
              <Skeleton className="h-24 rounded-xl bg-white/10" />
              <Skeleton className="h-24 rounded-xl bg-white/10" />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Submit events / PDP session</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {(insights.rfq_conversion.rate_rfq_submit_sessions_per_pdp_session * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {insights.rfq_conversion.distinct_sessions_rfq_submit_event_among_pdp} sessions with rfq_submit after
                  PDP
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">RFQ intent / PDP session</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {(insights.rfq_conversion.rate_rfq_intent_sessions_per_pdp_session * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {insights.rfq_conversion.distinct_sessions_rfq_intent_among_pdp} sessions (CTA or add_to_rfq)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Persisted RFQs / PDP session</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {(insights.rfq_conversion.rate_persisted_rfqs_per_pdp_session * 100).toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {insights.rfq_conversion.rfq_rows_persisted_in_period} RFQ rows in period (not session-unique)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Summary RFQ / visitors</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {loading ? "…" : `${(((summary?.rfq_conversion_rate || 0) * 100).toFixed(2))}%`}
                </p>
                <p className="mt-1 text-xs text-white/45">From summary: RFQs ÷ unique visitors (page_view)</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
