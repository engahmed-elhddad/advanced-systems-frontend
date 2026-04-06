import { AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationInsights } from '@/services/adminService'
import {
  getSeverity,
  SEVERITY_BG,
  SEVERITY_BORDER,
  SEVERITY_TEXT,
  type Severity,
} from '../_lib/ingestionThresholds'

interface Props {
  insights: ValidationInsights
  totalRows: number
  onViewRows: (field: string) => void
}

interface IssueRowData {
  field: string
  displayName: string
  count: number
  percentage: string
  severity: Severity
}

const TRACKED_FIELDS = [
  'part_number',
  'brand',
  'category',
  'stock_quantity',
  'description',
  'image_url',
  'price',
] as const

function toTitle(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function toPercent(part: number, total: number): string {
  if (total <= 0) return '0.0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function getIssueSeverity(count: number, totalRows: number): Severity {
  const errorRate = totalRows > 0 ? count / totalRows : 0
  const healthyRate = 1 - errorRate
  return getSeverity('valid_rate', healthyRate)
}

function buildIssueRows(insights: ValidationInsights, totalRows: number): IssueRowData[] {
  const fieldsFromErrors = Object.keys(insights.field_error_counts)
  const fieldsFromMissing = Object.keys(insights.required_field_missing_counts)
  const allTracked = Array.from(
    new Set([...TRACKED_FIELDS, ...fieldsFromErrors, ...fieldsFromMissing]),
  )

  return allTracked
    .map((field) => {
      const countFromErrors = insights.field_error_counts[field] ?? 0
      const countFromMissing = insights.required_field_missing_counts[field] ?? 0
      const count = Math.max(countFromErrors, countFromMissing)
      return {
        field,
        displayName: toTitle(field),
        count,
        percentage: toPercent(count, totalRows),
        severity: getIssueSeverity(count, totalRows),
      }
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.displayName.localeCompare(b.displayName)
    })
}

export function IssuePriorityList({ insights, totalRows, onViewRows }: Props) {
  const rows = buildIssueRows(insights, totalRows)

  return (
    <section className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[#6B7280]" aria-hidden />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Issue Priority</h3>
      </header>

      <div className="divide-y divide-[#F3F4F6]">
        {rows.map((row) => (
          <div
            key={row.field}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#1A1A1A]">{row.displayName}</p>
            </div>

            <p className="font-mono text-sm text-[#1A1A1A]">{row.count.toLocaleString()}</p>

            <span
              className={cn(
                'inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold',
                SEVERITY_BG[row.severity],
                SEVERITY_BORDER[row.severity],
                SEVERITY_TEXT[row.severity],
              )}
            >
              {row.percentage}
            </span>

            <button
              type="button"
              onClick={() => onViewRows(row.field)}
              className="inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-xs font-medium text-[#0072CE] transition-colors duration-150 hover:bg-[#E8F4FD] focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30"
            >
              View rows
              <ArrowRight className="h-3 w-3" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
