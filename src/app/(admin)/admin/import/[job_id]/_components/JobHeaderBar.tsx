import { FileSpreadsheet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { VariantProps } from 'class-variance-authority'
import type { IngestionJob } from '@/services/adminService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  job: IngestionJob
}

type BadgeVariant = NonNullable<VariantProps<typeof Badge>['variant']>

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
    <div className="flex flex-col gap-2 rounded-[2px] border border-[#E5E7EB] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: filename + meta */}
      <div className="flex min-w-0 items-start gap-3">
        <FileSpreadsheet
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]"
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="truncate font-mono text-sm font-semibold text-[#1A1A1A]"
              title={job.filename}
            >
              {job.filename}
            </span>
            <Badge variant={statusVariant} size="sm" dot>
              {job.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-[#6B7280]">{summary}</p>
        </div>
      </div>

      {/* Right: row count */}
      <div className="shrink-0 text-right">
        <span className="font-mono text-lg font-bold text-[#1A1A1A]">
          {job.total_rows.toLocaleString()}
        </span>
        <span className="ml-1 text-xs text-[#6B7280]">rows</span>
      </div>
    </div>
  )
}
