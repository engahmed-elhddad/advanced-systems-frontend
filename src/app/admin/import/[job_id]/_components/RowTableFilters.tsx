'use client'

import { Search, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui'
import { SELECT_EMPTY, sentinelToEmpty } from '@/lib/formSentinels'
import type { ValidationInsights } from '@/features/admin/services/adminService'
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
              'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/20',
              isActive
                ? 'border border-white/10 bg-white/[0.08] text-orange-400 shadow-sm'
                : 'text-white/50 hover:bg-white/[0.04] hover:text-white',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'font-mono text-[11px]',
                isActive ? 'text-orange-400' : 'text-white/30',
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
    <div className="min-w-[140px]">
      <Select
        variant="light"
        label="Field"
        placeholder="All fields"
        value={value ? value : SELECT_EMPTY}
        onChange={(v) => onChange(sentinelToEmpty(v) || null)}
        options={[
          { value: SELECT_EMPTY, label: 'All fields' },
          ...options.map((field) => ({ value: field, label: toFieldLabel(field) })),
        ]}
        triggerClassName="h-8 min-h-0 text-xs py-0"
        className="[&_label]:sr-only"
      />
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
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
        aria-hidden
      />
      <input
        type="search"
        aria-label="Search by part number"
        placeholder="Search part number…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-8 w-44 rounded-[2px] border border-white/10 bg-white/[0.04] py-0 pl-8 pr-3 text-xs text-white',
          'placeholder:text-white/30',
          'focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/20',
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
        'inline-flex items-center gap-1 rounded-[2px] border border-white/10 bg-white/[0.08]',
        'px-2 py-0.5 text-[11px] font-medium text-white',
        'transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20',
      )}
    >
      {chip.label}
      <X className="h-3 w-3 text-white/50" aria-hidden />
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
        'inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-xs font-medium text-white/50',
        'transition-colors hover:bg-white/[0.06] hover:text-white',
        'focus:outline-none focus:ring-2 focus:ring-white/20',
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
    <div className="space-y-2 border-b border-white/10 bg-white/[0.04] px-4 py-3">
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
          <span className="text-[11px] text-white/50">Active:</span>
          {chips.map((chip) => (
            <Chip key={chip.key} chip={chip} />
          ))}
        </div>
      )}
    </div>
  )
}
