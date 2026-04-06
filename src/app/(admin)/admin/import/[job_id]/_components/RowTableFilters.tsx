import { Search, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationInsights } from '@/services/adminService'
import type { RowStatusFilter } from '../_hooks/useJobDashboard'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RowTableFiltersProps {
  statusFilter: RowStatusFilter
  fieldFilter: string | null
  searchQuery: string
  statusCounts: Record<string, number>
  insights: ValidationInsights | null
  onStatusChange: (status: RowStatusFilter) => void
  onFieldChange: (field: string | null) => void
  onSearchChange: (query: string) => void
  onReset: () => void
}

interface StatusTab {
  value: RowStatusFilter
  label: string
  count: number
}

interface ActiveChip {
  key: string
  label: string
  onRemove: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TABS: Pick<StatusTab, 'value' | 'label'>[] = [
  { value: 'all',       label: 'All' },
  { value: 'invalid',   label: 'Invalid' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'valid',     label: 'Valid' },
  { value: 'approved',  label: 'Approved' },
]

function buildStatusTabs(statusCounts: Record<string, number>): StatusTab[] {
  const total = Object.values(statusCounts).reduce((sum, c) => sum + c, 0)
  return STATUS_TABS.map(({ value, label }) => ({
    value,
    label,
    count: value === 'all' ? total : (statusCounts[value] ?? 0),
  }))
}

function toTitle(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function toFieldLabel(field: string): string {
  return `${toTitle(field)} errors`
}

function buildFieldOptions(insights: ValidationInsights | null): string[] {
  if (!insights) return []
  const merged = new Set([
    ...Object.keys(insights.field_error_counts),
    ...Object.keys(insights.required_field_missing_counts),
  ])
  // only include fields that actually have errors
  return Array.from(merged)
    .filter((f) => (insights.field_error_counts[f] ?? 0) + (insights.required_field_missing_counts[f] ?? 0) > 0)
    .sort()
}

function buildActiveChips(
  statusFilter: RowStatusFilter,
  fieldFilter: string | null,
  searchQuery: string,
  onStatusChange: (s: RowStatusFilter) => void,
  onFieldChange: (f: string | null) => void,
  onSearchChange: (q: string) => void,
): ActiveChip[] {
  const chips: ActiveChip[] = []
  if (statusFilter !== 'all') {
    chips.push({
      key: 'status',
      label: toTitle(statusFilter),
      onRemove: () => onStatusChange('all'),
    })
  }
  if (fieldFilter) {
    chips.push({
      key: 'field',
      label: toFieldLabel(fieldFilter),
      onRemove: () => onFieldChange(null),
    })
  }
  if (searchQuery.trim()) {
    chips.push({
      key: 'search',
      label: `"${searchQuery.trim()}"`,
      onRemove: () => onSearchChange(''),
    })
  }
  return chips
}

function hasActiveFilters(
  statusFilter: RowStatusFilter,
  fieldFilter: string | null,
  searchQuery: string,
): boolean {
  return statusFilter !== 'all' || fieldFilter !== null || searchQuery.trim() !== ''
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: StatusTab[]
  active: RowStatusFilter
  onChange: (value: RowStatusFilter) => void
}) {
  return (
    <div role="tablist" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const isActive = active === tab.value
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 text-xs font-medium',
              'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
              isActive
                ? 'border border-[#E5E7EB] bg-white text-[#0072CE] shadow-sm'
                : 'text-[#6B7280] hover:bg-white/60 hover:text-[#1A1A1A]',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'font-mono text-[11px]',
                isActive ? 'text-[#0072CE]' : 'text-[#9CA3AF]',
              )}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FieldSelect({
  value,
  options,
  onChange,
}: {
  value: string | null
  options: string[]
  onChange: (field: string | null) => void
}) {
  if (options.length === 0) return null

  return (
    <div className="relative">
      <select
        aria-label="Filter by error field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          'h-8 appearance-none rounded-[2px] border border-[#E5E7EB] bg-white pl-3 pr-7 text-xs text-[#1A1A1A]',
          'focus:border-[#0072CE] focus:outline-none focus:ring-1 focus:ring-[#0072CE]/20',
        )}
      >
        <option value="">All fields</option>
        {options.map((field) => (
          <option key={field} value={field}>
            {toFieldLabel(field)}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#6B7280]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}

function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (q: string) => void
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
        aria-hidden
      />
      <input
        type="search"
        aria-label="Search by part number"
        placeholder="Search part number…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-8 w-44 rounded-[2px] border border-[#E5E7EB] bg-white py-0 pl-8 pr-3 text-xs text-[#1A1A1A]',
          'placeholder:text-[#9CA3AF]',
          'focus:border-[#0072CE] focus:outline-none focus:ring-1 focus:ring-[#0072CE]/20',
        )}
      />
    </div>
  )
}

function Chip({ chip }: { chip: ActiveChip }) {
  return (
    <button
      type="button"
      onClick={chip.onRemove}
      aria-label={`Remove filter: ${chip.label}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] border border-[#E5E7EB] bg-white',
        'px-2 py-0.5 text-[11px] font-medium text-[#1A1A1A]',
        'transition-colors hover:bg-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
      )}
    >
      {chip.label}
      <X className="h-3 w-3 text-[#6B7280]" aria-hidden />
    </button>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Reset all filters"
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-xs font-medium text-[#6B7280]',
        'transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A1A]',
        'focus:outline-none focus:ring-2 focus:ring-[#0072CE]/30',
      )}
    >
      <RotateCcw className="h-3 w-3" aria-hidden />
      Reset
    </button>
  )
}

// ── RowTableFilters ───────────────────────────────────────────────────────────

export function RowTableFilters({
  statusFilter,
  fieldFilter,
  searchQuery,
  statusCounts,
  insights,
  onStatusChange,
  onFieldChange,
  onSearchChange,
  onReset,
}: RowTableFiltersProps) {
  const tabs        = buildStatusTabs(statusCounts)
  const fieldOptions = buildFieldOptions(insights)
  const chips       = buildActiveChips(statusFilter, fieldFilter, searchQuery, onStatusChange, onFieldChange, onSearchChange)
  const isDirty     = hasActiveFilters(statusFilter, fieldFilter, searchQuery)

  return (
    <div className="space-y-2 rounded-t-[2px] border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
      {/* Row 1: tabs + controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusTabs tabs={tabs} active={statusFilter} onChange={onStatusChange} />

        <div className="flex items-center gap-2">
          <FieldSelect value={fieldFilter} options={fieldOptions} onChange={onFieldChange} />
          <SearchInput value={searchQuery} onChange={onSearchChange} />
          {isDirty && <ResetButton onClick={onReset} />}
        </div>
      </div>

      {/* Row 2: active filter chips — only rendered when filters are applied */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#6B7280]">Active:</span>
          {chips.map((chip) => (
            <Chip key={chip.key} chip={chip} />
          ))}
        </div>
      )}
    </div>
  )
}
