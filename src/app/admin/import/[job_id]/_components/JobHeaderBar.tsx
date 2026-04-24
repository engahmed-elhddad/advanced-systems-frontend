import { FileSpreadsheet } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui'
import type { IngestionJob } from '@/features/admin/services/adminService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  job: IngestionJob
}

// ── Helpers (no logic inside JSX) ─────────────────────────────────────────────

const STATUS_BADGE: Record<string, BadgeVariant> = {
  completed:          'success',
  validated:          'info',
  reviewing:          'warning',
  partially_approved: 'warning',
  parsing:            'info',
  failed:             'error',
  pending:            'pending',
}

function getStatusVariant(status: string): BadgeVariant {
  return STATUS_BADGE[status] ?? 'default'
}

function buildSummary(job: IngestionJob): string {
  const { invalid_rows, insights, total_rows } = job

  if (total_rows === 0) return 'No rows processed yet.'

  if (invalid_rows === 0) return `All ${total_rows} rows passed validation.`

  if (!insights) {
    return `${invalid_rows} of ${total_rows} rows have errors.`
  }

  const { field_error_counts } = insights
  const fieldCount = Object.keys(field_error_counts).filter(
    (f) => field_error_counts[f] > 0,
  ).length

  const topField = Object.entries(field_error_counts)
    .sort(([, a], [, b]) => b - a)
    .at(0)

  const fieldPhrase =
    fieldCount === 1
      ? `in 1 field`
      : `across ${fieldCount} fields`

  const topPhrase = topField ? ` — primary issue: ${topField[0]}` : ''

  return `${invalid_rows} error${invalid_rows === 1 ? '' : 's'} ${fieldPhrase}${topPhrase}.`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobHeaderBar({ job }: Props) {
  const summary = buildSummary(job)
  const statusVariant = getStatusVariant(job.status)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: filename + meta */}
      <div className="flex min-w-0 items-start gap-3">
        <FileSpreadsheet
          className="mt-0.5 h-4 w-4 shrink-0 text-white/50"
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="truncate font-mono text-sm font-semibold text-white"
              title={job.filename}
            >
              {job.filename}
            </span>
            <Badge variant={statusVariant} size="sm" dot>
              {job.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-white/50">{summary}</p>
        </div>
      </div>

      {/* Right: row count */}
      <div className="shrink-0 text-right">
        <span className="font-mono text-lg font-bold text-white">
          {job.total_rows.toLocaleString()}
        </span>
        <span className="ml-1 text-xs text-white/50">rows</span>
      </div>
    </div>
  )
}
