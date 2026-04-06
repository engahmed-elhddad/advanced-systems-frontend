import { BarChart3, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationInsights } from '@/services/adminService'
import {
  getSeverity,
  getSeverityInverted,
  SEVERITY_BAR,
  SEVERITY_TEXT,
  type Severity,
} from '../_lib/ingestionThresholds'

interface Props {
  insights: ValidationInsights
}

interface ResolutionMetric {
  key: 'brand' | 'category'
  label: string
  rate: number
  percentLabel: string
  severity: Severity
  description: string
}

interface SnapshotMetric {
  key: 'description_coverage' | 'stock_validity' | 'duplicate_rate'
  label: string
  valueLabel: string
  severity: Severity
  helper: string
}

function toPercentLabel(value: number): string {
  return `${Math.round(value * 100)}%`
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function buildResolutionMetrics(insights: ValidationInsights): ResolutionMetric[] {
  const brandRate = clamp01(insights.brand_resolution_rate)
  const categoryRate = clamp01(insights.category_resolution_rate)

  return [
    {
      key: 'brand',
      label: 'Brand Resolution',
      rate: brandRate,
      percentLabel: toPercentLabel(brandRate),
      severity: getSeverity('brand_resolution_rate', brandRate),
      description: 'Share of rows where the uploaded brand matched an existing brand record.',
    },
    {
      key: 'category',
      label: 'Category Resolution',
      rate: categoryRate,
      percentLabel: toPercentLabel(categoryRate),
      severity: getSeverity('category_resolution_rate', categoryRate),
      description: 'Share of rows where category values mapped to the catalog taxonomy.',
    },
  ]
}

function buildSnapshotMetrics(insights: ValidationInsights): SnapshotMetric[] {
  const descriptionCoverage = clamp01(insights.description_coverage)
  const duplicateRate = insights.valid_rows + insights.invalid_rows > 0
    ? clamp01(insights.duplicate_rows / (insights.valid_rows + insights.invalid_rows))
    : 0

  const invalidStockRate = insights.valid_rows + insights.invalid_rows > 0
    ? clamp01(insights.negative_or_invalid_stock_rows / (insights.valid_rows + insights.invalid_rows))
    : 0
  const stockValidity = clamp01(1 - invalidStockRate)

  return [
    {
      key: 'description_coverage',
      label: 'Description Coverage',
      valueLabel: toPercentLabel(descriptionCoverage),
      severity: getSeverity('description_coverage', descriptionCoverage),
      helper: 'Rows containing usable product descriptions.',
    },
    {
      key: 'stock_validity',
      label: 'Stock Validity',
      valueLabel: toPercentLabel(stockValidity),
      severity: getSeverity('valid_rate', stockValidity),
      helper: 'Rows with valid stock quantities (non-negative, numeric).',
    },
    {
      key: 'duplicate_rate',
      label: 'Duplicate Rate',
      valueLabel: toPercentLabel(duplicateRate),
      severity: getSeverityInverted(duplicateRate),
      helper: 'Rows flagged as duplicates (existing catalog or within file).',
    },
  ]
}

function ResolutionBar({ metric }: { metric: ResolutionMetric }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#1A1A1A]">{metric.label}</p>
        <span className={cn('font-mono text-xs font-semibold', SEVERITY_TEXT[metric.severity])}>
          {metric.percentLabel}
        </span>
      </div>
      <div className="h-2 rounded-[2px] bg-[#F3F4F6]">
        <div
          className={cn('h-full rounded-[2px] transition-all duration-150', SEVERITY_BAR[metric.severity])}
          style={{ width: `${metric.rate * 100}%` }}
          role="progressbar"
          aria-label={metric.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(metric.rate * 100)}
        />
      </div>
      <p className="text-[11px] text-[#6B7280]">{metric.description}</p>
    </div>
  )
}

function ResolutionRatesCard({ insights }: { insights: ValidationInsights }) {
  const metrics = buildResolutionMetrics(insights)

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#6B7280]" aria-hidden />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Resolution Rates</h3>
      </header>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <ResolutionBar key={metric.key} metric={metric} />
        ))}
      </div>
    </div>
  )
}

function SnapshotTile({ metric }: { metric: SnapshotMetric }) {
  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
        {metric.label}
      </p>
      <p className={cn('mt-1 font-mono text-2xl font-bold', SEVERITY_TEXT[metric.severity])}>
        {metric.valueLabel}
      </p>
      <p className="mt-1 text-[11px] text-[#6B7280]">{metric.helper}</p>
    </div>
  )
}

function CoverageSnapshotCard({ insights }: { insights: ValidationInsights }) {
  const metrics = buildSnapshotMetrics(insights)

  return (
    <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4 text-[#6B7280]" aria-hidden />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Coverage Snapshot</h3>
      </header>

      <div className="grid gap-2">
        {metrics.map((metric) => (
          <SnapshotTile key={metric.key} metric={metric} />
        ))}
      </div>
    </div>
  )
}

export function RootCausePanel({ insights }: Props) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <ResolutionRatesCard insights={insights} />
      <CoverageSnapshotCard insights={insights} />
    </section>
  )
}
