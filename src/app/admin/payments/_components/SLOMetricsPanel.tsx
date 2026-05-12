'use client'

/**
 * Spec 031 T010 — 4 metric cards summarizing the last 24h of payment health.
 *
 * Reads from `usePaymentStats()`. Renders skeleton placeholders while loading
 * (same dimensions as the real cards to avoid layout shift). Error state
 * surfaces a one-line failure message — operators can still see the rest of
 * the dashboard if this panel fails.
 */

import type { PaymentStats } from '../_hooks/usePaymentStats'

interface MetricDef {
  key: keyof PaymentStats
  label: string
  tone: 'neutral' | 'warning' | 'danger'
}

const METRICS: MetricDef[] = [
  { key: 'duplicate_count', label: 'Duplicate deliveries', tone: 'neutral' },
  { key: 'replay_attack_count', label: 'Replay attacks blocked', tone: 'warning' },
  { key: 'invalid_transition_count', label: 'Invalid transitions rejected', tone: 'warning' },
  { key: 'reconciliation_drift_count', label: 'Reconciliation drift', tone: 'danger' },
]

const TONE_CLASSES: Record<MetricDef['tone'], string> = {
  neutral: 'border-[--border] bg-[--bg-elevated] text-[--text-primary]',
  warning: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  danger: 'border-red-400/30 bg-red-500/10 text-red-100',
}

interface SLOMetricsPanelProps {
  stats: PaymentStats | undefined
  isLoading: boolean
  error: Error | null | unknown
}

export function SLOMetricsPanel({ stats, isLoading, error }: SLOMetricsPanelProps) {
  if (error && !stats) {
    return (
      <section aria-labelledby="slo-metrics-title" className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
        <h2 id="slo-metrics-title" className="font-semibold">SLO metrics unavailable</h2>
        <p className="mt-1 opacity-80">{error instanceof Error ? error.message : 'Unknown error fetching /api/payments/stats'}</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="slo-metrics-title" className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 id="slo-metrics-title" className="text-sm font-semibold uppercase tracking-wide text-[--text-secondary]">
          SLO — past {stats?.window_hours ?? 24}h
        </h2>
        {isLoading && !stats && (
          <span className="text-xs text-[--text-secondary]">Loading…</span>
        )}
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => {
          const value = stats?.[metric.key]
          const display = stats == null ? '—' : String(value ?? 0)
          return (
            <div
              key={metric.key}
              data-testid={`slo-card-${metric.key}`}
              className={`rounded-lg border p-4 transition-opacity ${TONE_CLASSES[metric.tone]} ${
                isLoading && !stats ? 'animate-pulse opacity-60' : ''
              }`}
            >
              <div className="text-xs font-medium uppercase tracking-wide opacity-80">{metric.label}</div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{display}</div>
              <div className="mt-1 text-[10px] opacity-60">Past {stats?.window_hours ?? 24}h</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
