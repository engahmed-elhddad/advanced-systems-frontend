import { CheckCircle2, AlertTriangle, XCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationInsights } from '@/features/admin/services/adminService'
import {
  getVerdictSeverity,
  getVerdictLabel,
  getVerdictDescription,
  getSeverityInverted,
  SEVERITY_TEXT,
  SEVERITY_BG,
  SEVERITY_BORDER,
  type Severity,
  type VerdictSeverity,
} from '../_lib/ingestionThresholds'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  insights: ValidationInsights
  totalRows: number
}

interface QuickStat {
  label: string
  value: string
  sub: string
  severity: Severity
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERDICT_ICON: Record<VerdictSeverity, React.ComponentType<{ className?: string }>> = {
  green: CheckCircle2,
  amber: AlertTriangle,
  red:   XCircle,
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function buildQuickStats(insights: ValidationInsights, totalRows: number): QuickStat[] {
  const invalidRate  = totalRows > 0 ? insights.invalid_rows / totalRows : 0
  const duplicateRate = totalRows > 0 ? insights.duplicate_rows / totalRows : 0

  return [
    {
      label: 'Valid Rows',
      value: insights.valid_rows.toLocaleString(),
      sub:   `${pct(totalRows > 0 ? insights.valid_rows / totalRows : 0)} of total`,
      severity: invalidRate <= 0.05 ? 'green' : invalidRate <= 0.20 ? 'amber' : 'red',
    },
    {
      label: 'Invalid Rows',
      value: insights.invalid_rows.toLocaleString(),
      sub:   `${pct(invalidRate)} error rate`,
      severity: invalidRate === 0 ? 'green' : invalidRate <= 0.20 ? 'amber' : 'red',
    },
    {
      label: 'Duplicates',
      value: insights.duplicate_rows.toLocaleString(),
      sub:   `${insights.duplicate_rows_existing} existing · ${insights.duplicate_rows_within_job} in file`,
      severity: getSeverityInverted(duplicateRate),
    },
    {
      label: 'Quality Score',
      value: pct(insights.quality_score),
      sub:   'weighted validation score',
      severity:
        insights.quality_score >= 0.85 ? 'green'
        : insights.quality_score >= 0.65 ? 'amber'
        : 'red',
    },
  ]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerdictCard({
  insights,
  totalRows,
}: {
  insights: ValidationInsights
  totalRows: number
}) {
  const invalidRate = totalRows > 0 ? insights.invalid_rows / totalRows : 0
  const severity    = getVerdictSeverity(insights.quality_score, invalidRate)
  const label       = getVerdictLabel(severity)
  const description = getVerdictDescription(severity)
  const Icon        = VERDICT_ICON[severity]

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-[2px] border p-5',
        SEVERITY_BG[severity],
        SEVERITY_BORDER[severity],
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', SEVERITY_TEXT[severity])}
          aria-hidden
        />
        <div>
          <p className={cn('text-base font-semibold', SEVERITY_TEXT[severity])}>
            {label}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
        </div>
      </div>

      {/* Score callout */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
          Quality Score
        </p>
        <p className={cn('mt-0.5 font-mono text-3xl font-bold', SEVERITY_TEXT[severity])}>
          {pct(insights.quality_score)}
        </p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          40% validation · 30% brand · 20% dedup · 10% descriptions
        </p>
      </div>
    </div>
  )
}

function QuickStatCard({ stat }: { stat: QuickStat }) {
  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
        {stat.label}
      </p>
      <p className={cn('mt-1 font-mono text-2xl font-bold', SEVERITY_TEXT[stat.severity])}>
        {stat.value}
      </p>
      <p className="mt-1 text-[11px] text-[#6B7280]">{stat.sub}</p>
    </div>
  )
}

// ── VerdictSection ────────────────────────────────────────────────────────────

export function VerdictSection({ insights, totalRows }: Props) {
  const quickStats = buildQuickStats(insights, totalRows)

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <VerdictCard insights={insights} totalRows={totalRows} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickStats.map((stat) => (
          <QuickStatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  )
}
