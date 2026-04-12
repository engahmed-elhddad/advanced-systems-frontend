'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Package,
  Timer,
  TrendingUp,
  XCircle,
  Zap,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import {
  getIngestionDashboard,
  type IngestionDashboardResponse,
  type DailyMetric,
  type PerformanceAverages,
} from '@/features/admin/services/adminService'

const EVENT_LABELS: Record<string, string> = {
  upload: 'Upload',
  parse_complete: 'Parsed',
  validation_complete: 'Validated',
  rows_approved: 'Approved',
  rows_rejected: 'Rejected',
  publish_start: 'Publish Started',
  publish_complete: 'Published',
  publish_error: 'Publish Error',
  ai_enrich_queued: 'AI Queued',
  job_deleted: 'Job Deleted',
}

const EVENT_COLORS: Record<string, string> = {
  upload: 'text-[#0072CE]',
  parse_complete: 'text-sky-500',
  validation_complete: 'text-sky-600',
  rows_approved: 'text-emerald-600',
  rows_rejected: 'text-red-500',
  publish_start: 'text-amber-500',
  publish_complete: 'text-emerald-600',
  publish_error: 'text-red-600',
  ai_enrich_queued: 'text-purple-500',
  job_deleted: 'text-[#6B7280]',
}

export default function IngestionDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ingestion-dashboard'],
    queryFn: getIngestionDashboard,
    refetchInterval: 30_000,
  })

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6B7280]">
        <AlertTriangle className="mb-3 h-8 w-8" />
        <p className="text-sm">Failed to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Ingestion Pipeline Health</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Real-time observability for bulk product ingestion.
        </p>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && <AlertsPanel warnings={data.warnings} />}

      {/* Overview Cards */}
      <OverviewCards overview={data.overview} />

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyChart metrics={data.daily_metrics} />
        <QualityPanel
          avgScore={data.overview.avg_quality_score}
          topErrors={data.top_validation_errors}
        />
      </div>

      {/* Performance Section */}
      <PerformanceSection averages={data.overview.performance_averages} />

      {/* Recent Jobs + Events */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentJobsTable jobs={data.recent_jobs} />
        <EventTimeline events={data.recent_events} />
      </div>
    </div>
  )
}

// ── Overview Cards ───────────────────────────────────────────────────────────

function OverviewCards({ overview }: { overview: IngestionDashboardResponse['overview'] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        icon={<FileSpreadsheet className="h-4 w-4" />}
        label="Total Jobs"
        value={overview.total_jobs}
      />
      <StatCard
        icon={<Package className="h-4 w-4" />}
        label="Rows Processed"
        value={overview.total_rows_processed}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        label="Published Jobs"
        value={overview.total_published_jobs}
        color="text-emerald-600"
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4 text-[#0072CE]" />}
        label="Success Rate"
        value={`${overview.overall_success_rate}%`}
        color="text-[#0072CE]"
      />
      <StatCard
        icon={<Shield className="h-4 w-4 text-amber-500" />}
        label="Avg Quality"
        value={
          overview.avg_quality_score !== null
            ? `${(overview.avg_quality_score * 100).toFixed(0)}%`
            : '—'
        }
        color={
          overview.avg_quality_score !== null && overview.avg_quality_score >= 0.7
            ? 'text-emerald-600'
            : 'text-amber-600'
        }
      />
    </div>
  )
}

const StatCard = React.memo(function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-2 text-[#6B7280]">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('mt-1.5 text-2xl font-bold', color ?? 'text-[#1A1A1A]')}>{value}</p>
    </div>
  )
})

// ── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({ warnings }: { warnings: IngestionDashboardResponse['warnings'] }) {
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-3 rounded-[2px] border p-3',
            w.severity === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50',
          )}
        >
          <AlertTriangle
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0',
              w.severity === 'error' ? 'text-red-600' : 'text-amber-600',
            )}
          />
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium',
                w.severity === 'error' ? 'text-red-800' : 'text-amber-800',
              )}
            >
              {w.message}
            </p>
            {w.details.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {w.details.slice(0, 5).map((d, j) => (
                  <p key={j} className="text-xs text-[#6B7280]">
                    {w.type === 'stuck_jobs'
                      ? `Job #${d.job_id} (${d.filename}) — ${d.hours_stuck}h stuck in "${d.status}"`
                      : `Job #${d.job_id} (${d.filename}) — score: ${d.quality_score}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Daily Chart (lightweight bar chart) ──────────────────────────────────────

function DailyChart({ metrics }: { metrics: DailyMetric[] }) {
  const sorted = useMemo(() => [...metrics].reverse().slice(-14), [metrics])
  const maxRows = useMemo(() => Math.max(1, ...sorted.map((m) => m.total_rows)), [sorted])

  if (sorted.length === 0) {
    return (
      <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <BarChart3 className="h-4 w-4 text-[#6B7280]" />
          Daily Volume
        </h3>
        <p className="mt-6 text-center text-sm text-[#6B7280]">
          No data yet. Upload a CSV to see trends.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        <BarChart3 className="h-4 w-4 text-[#6B7280]" />
        Daily Volume (last 14 days)
      </h3>
      <div className="mt-4 flex items-end gap-1" style={{ height: 120 }}>
        {sorted.map((m) => {
          const validPct = (m.valid_rows / Math.max(m.total_rows, 1)) * 100
          const barH = Math.max(4, (m.total_rows / maxRows) * 100)
          return (
            <div key={m.day} className="group relative flex flex-1 flex-col items-center">
              <div
                className="absolute -top-14 z-10 hidden whitespace-nowrap rounded-[2px] bg-[#1A1A1A] px-2 py-1 text-[10px] text-white shadow-sm group-hover:block"
              >
                {m.day}: {m.total_rows} rows ({m.success_rate}% valid)
              </div>
              <div
                className="w-full rounded-t-[1px] transition-all"
                style={{
                  height: `${barH}%`,
                  background:
                    validPct >= 80
                      ? '#10B981'
                      : validPct >= 50
                        ? '#F59E0B'
                        : '#EF4444',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[#6B7280]">
        <span>{sorted[0]?.day}</span>
        <span>{sorted[sorted.length - 1]?.day}</span>
      </div>
      <div className="mt-2 flex gap-3 text-[10px] text-[#6B7280]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> ≥80% valid
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> 50-80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> &lt;50%
        </span>
      </div>
    </div>
  )
}

// ── Quality Panel ────────────────────────────────────────────────────────────

function QualityPanel({
  avgScore,
  topErrors,
}: {
  avgScore: number | null
  topErrors: IngestionDashboardResponse['top_validation_errors']
}) {
  const pct = avgScore !== null ? Math.round(avgScore * 100) : null

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        <Shield className="h-4 w-4 text-[#6B7280]" />
        Data Quality
      </h3>

      {/* Score Ring */}
      <div className="mt-4 flex items-center gap-6">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={pct !== null && pct >= 70 ? '#10B981' : '#F59E0B'}
              strokeWidth="3"
              strokeDasharray={`${(pct ?? 0)} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-lg font-bold text-[#1A1A1A]">
            {pct !== null ? `${pct}%` : '—'}
          </span>
        </div>
        <div className="text-xs text-[#6B7280]">
          <p className="font-medium text-[#1A1A1A]">Average Quality Score</p>
          <p className="mt-0.5">
            40% validation pass · 30% brand resolution · 20% dedup · 10% descriptions
          </p>
        </div>
      </div>

      {/* Top Errors */}
      {topErrors.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            Top Validation Errors
          </p>
          <div className="mt-2 space-y-1.5">
            {topErrors.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-[2px] bg-[#F9FAFB] px-2 py-1.5"
              >
                <div className="text-xs">
                  <span className="font-medium text-[#1A1A1A]">{e.field}</span>
                  <span className="ml-1 text-[#6B7280]">{e.error}</span>
                </div>
                <span className="font-mono text-xs text-red-600">{e.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Performance Section ───────────────────────────────────────────────────────

function PerformanceSection({ averages }: { averages: PerformanceAverages }) {
  const hasData = Object.values(averages).some((v) => v !== null)

  const cards = [
    {
      label: 'Avg Parse Time',
      value: averages.avg_parse_seconds,
      desc: 'CSV read + DB insert',
      color: 'text-[#0072CE]',
    },
    {
      label: 'Avg Validation',
      value: averages.avg_validation_seconds,
      desc: 'Business rule checks',
      color: 'text-sky-600',
    },
    {
      label: 'Avg Review Wait',
      value: averages.avg_review_wait_seconds,
      desc: 'Validated → publish triggered',
      color: 'text-amber-600',
    },
    {
      label: 'Avg Publish',
      value: averages.avg_publish_seconds,
      desc: 'DB insert to products',
      color: 'text-emerald-600',
    },
    {
      label: 'Avg Total',
      value: averages.avg_total_seconds,
      desc: 'End-to-end wall clock',
      color: 'text-[#1A1A1A]',
    },
  ]

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        <Timer className="h-4 w-4 text-[#6B7280]" />
        Pipeline Performance
        {!hasData && (
          <span className="ml-1 text-[11px] font-normal text-[#6B7280]">
            — data available after next upload
          </span>
        )}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-[2px] border border-[#F3F4F6] bg-[#F9FAFB] p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
              {c.label}
            </p>
            <p className={cn('mt-1 text-xl font-bold font-mono', c.color)}>
              {c.value !== null ? formatDuration(c.value) : '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">{c.desc}</p>
          </div>
        ))}
      </div>
      {hasData && averages.avg_review_wait_seconds !== null && averages.avg_review_wait_seconds > 3600 && (
        <p className="mt-3 text-xs text-amber-700">
          ⚠ Average review wait exceeds 1 hour — consider reviewing staged jobs more frequently.
        </p>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

// ── Recent Jobs Table ────────────────────────────────────────────────────────

function RecentJobsTable({ jobs }: { jobs: IngestionDashboardResponse['recent_jobs'] }) {
  const JOB_BADGE: Record<string, 'success' | 'warning' | 'error' | 'info' | 'pending'> = {
    completed: 'success',
    validated: 'info',
    reviewing: 'warning',
    partially_approved: 'warning',
    failed: 'error',
    pending: 'pending',
    parsing: 'info',
  }

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <Clock className="h-4 w-4 text-[#6B7280]" />
          Recent Jobs
        </h3>
      </div>
      {jobs.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[#6B7280]">No jobs yet.</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#F9FAFB]">
              <tr className="border-b border-[#E5E7EB]">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">File</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Rows</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Quality</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Time</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                  <td className="max-w-[120px] truncate px-3 py-2 text-xs font-medium text-[#1A1A1A]">
                    {j.filename}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={JOB_BADGE[j.status] ?? 'default'} size="sm">
                      {j.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    <span className="text-emerald-600">{j.valid_rows}</span>
                    <span className="text-[#6B7280]">/</span>
                    <span>{j.total_rows}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {j.quality_score !== null && j.quality_score !== undefined
                      ? `${Math.round(j.quality_score * 100)}%`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-[#6B7280]">
                    {j.durations?.total_seconds != null
                      ? formatDuration(j.durations.total_seconds)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Event Timeline ───────────────────────────────────────────────────────────

function EventTimeline({ events }: { events: IngestionDashboardResponse['recent_events'] }) {
  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <Activity className="h-4 w-4 text-[#6B7280]" />
          Event Log
        </h3>
      </div>
      {events.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[#6B7280]">No events recorded yet.</p>
      ) : (
        <div className="max-h-[300px] space-y-0 overflow-y-auto">
          {events.map((e) => {
            const label = EVENT_LABELS[e.event_type] ?? e.event_type
            const color = EVENT_COLORS[e.event_type] ?? 'text-[#6B7280]'
            const time = e.created_at
              ? new Date(e.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''

            const detail = formatEventDetail(e.event_type, e.metadata)

            return (
              <div
                key={e.id}
                className="flex items-start gap-3 border-b border-[#F3F4F6] px-4 py-2.5 last:border-b-0"
              >
                <div className={cn('mt-0.5', color)}>
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-medium', color)}>{label}</span>
                    {e.job_id && (
                      <span className="text-[10px] text-[#6B7280]">Job #{e.job_id}</span>
                    )}
                  </div>
                  {detail && <p className="mt-0.5 text-[11px] text-[#6B7280]">{detail}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-[#6B7280]">{time}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatEventDetail(
  eventType: string,
  meta: Record<string, unknown>,
): string {
  switch (eventType) {
    case 'upload':
      return `${meta.filename ?? ''} (${formatBytes(meta.file_size_bytes as number)})`
    case 'parse_complete':
      return `${meta.total_rows ?? 0} rows parsed`
    case 'validation_complete':
      return `${meta.valid_rows ?? 0} valid, ${meta.invalid_rows ?? 0} invalid — quality: ${meta.quality_score ?? '?'}`
    case 'rows_approved':
      return `${meta.count ?? 0} rows approved (${meta.method ?? ''})`
    case 'rows_rejected':
      return `${meta.count ?? 0} rows rejected`
    case 'publish_start':
      return `Publishing ${meta.approved_count ?? 0} rows`
    case 'publish_complete':
      return `${meta.published ?? 0} published, ${meta.error_count ?? 0} errors`
    case 'publish_error':
      return `${(meta.errors as Array<Record<string, unknown>>)?.length ?? 0} publish errors`
    case 'ai_enrich_queued':
      return `${meta.count ?? 0} products queued for AI enrichment`
    case 'job_deleted':
      return `${meta.filename ?? ''} (${meta.total_rows ?? 0} rows)`
    default:
      return ''
  }
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-6 w-60 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-[#E5E7EB]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
        <div className="h-48 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
      </div>
      <div className="h-24 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
        <div className="h-64 animate-pulse rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB]" />
      </div>
    </div>
  )
}
