'use client'

import { memo, useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, type BadgeProps } from '@/components/ui'
import type { StagedRow } from '@/features/admin/services/adminService'
import { useJobDashboard, type EditRowPayload } from '../_hooks/useJobDashboard'
import { RowInlineEdit } from './RowInlineEdit'
import { BulkActionBar } from './BulkActionBar'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  jobId: number
}

interface DisplayRow {
  id: number
  rowNumber: number
  partNumber: string
  brandRaw: string
  brandResolved: boolean
  categoryRaw: string
  categoryResolved: boolean
  stock: string
  status: string
  errorFields: string
}

type BadgeVariant = NonNullable<BadgeProps['variant']>

// ── Constants ─────────────────────────────────────────────────────────────────

const ROW_HEIGHT_PX = 40
const SCROLL_MAX_HEIGHT = 600
const OVERSCAN = 5

/**
 * Column width classes — applied identically to header and body cells
 * so flex-based widths stay aligned across the sticky header and the
 * absolutely-positioned virtual rows.
 */
const C = {
  select: 'w-10 shrink-0 px-3 py-2',
  expand: 'w-8 shrink-0 px-2 py-2',
  row:    'w-14 shrink-0 px-3 py-2',
  pn:     'min-w-0 flex-[1.5] px-3 py-2',
  brand:  'min-w-0 flex-1 px-3 py-2',
  cat:    'min-w-0 flex-1 px-3 py-2',
  stock:  'w-[72px] shrink-0 px-3 py-2 text-right',
  status: 'w-24 shrink-0 px-3 py-2',
  errors: 'min-w-0 flex-[1.5] px-3 py-2',
  edit:   'w-8 shrink-0 px-2 py-2',
} as const

const TH = 'text-[11px] font-semibold uppercase tracking-wider text-white/40'

// ── Row helpers ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, BadgeVariant> = {
  valid: 'success',
  approved: 'info',
  published: 'success',
  invalid: 'error',
  duplicate: 'warning',
  pending: 'pending',
}

function getStatusVariant(status: string): BadgeVariant {
  return STATUS_BADGE[status] ?? 'default'
}

function buildErrorFieldLabel(errors: Array<{ field: string; error: string }>): string {
  const fields = Array.from(new Set(errors.map((e) => e.field).filter(Boolean)))
  return fields.length > 0 ? fields.join(', ') : '—'
}

function toDisplayRow(row: StagedRow): DisplayRow {
  return {
    id: row.id,
    rowNumber: row.row_number,
    partNumber: row.part_number?.trim() || '—',
    brandRaw: row.brand_raw?.trim() || '—',
    brandResolved: row.brand_id !== null,
    categoryRaw: row.category_raw?.trim() || '—',
    categoryResolved: row.category_id !== null,
    stock: Number.isFinite(row.stock_quantity) ? row.stock_quantity.toString() : '—',
    status: row.status || 'unknown',
    errorFields: buildErrorFieldLabel(row.validation_errors ?? []),
  }
}

// ── State components ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-[2px] bg-white/[0.08]" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-8 text-center text-sm text-white/50">
      No rows available for this job.
    </div>
  )
}

function ErrorState() {
  return (
    <div className="p-8 text-center text-sm text-amber-400">
      Failed to load rows. Please retry.
    </div>
  )
}

// ── VirtualRow ────────────────────────────────────────────────────────────────

interface VirtualRowProps {
  display: DisplayRow
  rawRow: StagedRow | undefined
  isExpanded: boolean
  isSaving: boolean
  isSelected: boolean
  ariaRowIndex: number
  onToggle: (id: number) => void
  onSelect: (id: number) => void
  onSave: (payload: EditRowPayload) => void
  onCancel: () => void
}

const VirtualRow = memo(function VirtualRow({
  display,
  rawRow,
  isExpanded,
  isSaving,
  isSelected,
  ariaRowIndex,
  onToggle,
  onSelect,
  onSave,
  onCancel,
}: VirtualRowProps) {
  return (
    <>
      {/* Data cells */}
      <div
        role="row"
        aria-rowindex={ariaRowIndex}
        className={cn(
          'flex items-center border-b border-white/[0.06] transition-colors',
          isSelected && 'bg-orange-400/10',
          isExpanded ? 'bg-orange-400/5' : !isSelected && 'hover:bg-white/[0.04]',
        )}
      >
        <div role="cell" className={C.select}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(display.id)}
            aria-label={`Select row ${display.rowNumber}`}
            className="h-3.5 w-3.5 rounded-[2px] border-white/10 accent-orange-400"
          />
        </div>

        <div role="cell" className={C.expand}>
          <button
            type="button"
            onClick={() => onToggle(display.id)}
            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            aria-expanded={isExpanded}
            className="rounded-[2px] p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150',
                isExpanded && 'rotate-90',
              )}
              aria-hidden
            />
          </button>
        </div>

        <div role="cell" className={cn(C.row, 'font-mono text-xs text-white/50')}>
          {display.rowNumber}
        </div>

        <div role="cell" className={cn(C.pn, 'truncate font-mono text-xs font-semibold text-white')}>
          {display.partNumber}
        </div>

        <div role="cell" className={C.brand}>
          <div className="flex flex-col truncate">
            <span className="truncate text-xs text-white">{display.brandRaw}</span>
            <span className={cn('text-[11px]', display.brandResolved ? 'text-emerald-400' : 'text-white/50')}>
              {display.brandResolved ? 'resolved' : 'unresolved'}
            </span>
          </div>
        </div>

        <div role="cell" className={C.cat}>
          <div className="flex flex-col truncate">
            <span className="truncate text-xs text-white">{display.categoryRaw}</span>
            <span className={cn('text-[11px]', display.categoryResolved ? 'text-emerald-400' : 'text-white/50')}>
              {display.categoryResolved ? 'resolved' : 'unresolved'}
            </span>
          </div>
        </div>

        <div role="cell" className={cn(C.stock, 'font-mono text-xs text-white')}>
          {display.stock}
        </div>

        <div role="cell" className={C.status}>
          <Badge variant={getStatusVariant(display.status)} size="sm" dot>
            {display.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        <div role="cell" className={cn(C.errors, 'truncate text-xs text-white/50')}>
          {display.errorFields}
        </div>

        <div role="cell" className={C.edit}>
          <button
            type="button"
            onClick={() => onToggle(display.id)}
            aria-label="Edit row"
            className="rounded-[2px] p-1 text-white/50 transition-colors hover:bg-orange-400/10 hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Expanded inline edit */}
      {isExpanded && rawRow && (
        <RowInlineEdit
          row={rawRow}
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </>
  )
})

// ── RowTable ──────────────────────────────────────────────────────────────────

export function RowTable({ jobId }: Props) {
  const { rows, isLoading, isError, expandedRowId, actions, selection, mutations } = useJobDashboard(jobId)

  const displayRows = useMemo(() => rows.map(toDisplayRow), [rows])

  const rawRowById = useMemo(() => {
    const map = new Map<number, StagedRow>()
    for (const row of rows) map.set(row.id, row)
    return map
  }, [rows])

  // ── Virtualizer ──────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN,
  })

  useEffect(() => {
    virtualizer.measure()
  }, [expandedRowId, virtualizer])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggle = (id: number) => {
    actions.setExpandedRowId(expandedRowId === id ? null : id)
  }

  const handleSave = (payload: EditRowPayload) => {
    mutations.editRow.mutate(payload)
  }

  const handleCancel = () => {
    actions.setExpandedRowId(null)
  }

  // ── Boundary states ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.04]">
        <TableSkeleton />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.04]">
        <ErrorState />
      </section>
    )
  }

  if (displayRows.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.04]">
        <EmptyState />
      </section>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <section className="space-y-2">
      <BulkActionBar
        rows={rows}
        selection={selection}
        mutations={mutations}
        jobId={jobId}
      />

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: SCROLL_MAX_HEIGHT }}
        >
          <div
            className="min-w-[1040px]"
            role="table"
            aria-label="Staged products"
            aria-rowcount={displayRows.length}
          >
            {/* ── Sticky header ─────────────────────────────────────────── */}
            <div
              role="rowgroup"
              className="sticky top-0 z-10 border-b border-white/10 bg-[#030712]"
            >
              <div role="row" className="flex items-center">
                <div role="columnheader" className={cn(C.select, TH)}>
                  <input
                    type="checkbox"
                    checked={selection.isAllSelected}
                    onChange={selection.toggleAllOnPage}
                    aria-label="Select all rows on this page"
                    className="h-3.5 w-3.5 rounded-[2px] border-white/10 accent-orange-400"
                  />
                </div>
                <div role="columnheader" className={cn(C.expand, TH)} />
                <div role="columnheader" className={cn(C.row, TH)}>Row</div>
                <div role="columnheader" className={cn(C.pn, TH)}>Part Number</div>
                <div role="columnheader" className={cn(C.brand, TH)}>Brand</div>
                <div role="columnheader" className={cn(C.cat, TH)}>Category</div>
                <div role="columnheader" className={cn(C.stock, TH)}>Stock</div>
                <div role="columnheader" className={cn(C.status, TH)}>Status</div>
                <div role="columnheader" className={cn(C.errors, TH)}>Errors</div>
                <div role="columnheader" className={cn(C.edit, TH)} />
              </div>
            </div>

            {/* ── Virtual body ──────────────────────────────────────────── */}
            <div
              role="rowgroup"
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
              }}
            >
              {virtualItems.map((vi) => {
                const dRow = displayRows[vi.index]
                if (!dRow) return null

                const rawRow = rawRowById.get(dRow.id)
                const isExpanded = expandedRowId === dRow.id
                const isSaving =
                  mutations.editRow.isPending &&
                  mutations.editRow.variables?.rowId === dRow.id
                const isSelected = selection.selectedRowIds.has(dRow.id)

                return (
                  <div
                    key={vi.key}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${vi.start}px)`,
                    }}
                  >
                    <VirtualRow
                      display={dRow}
                      rawRow={rawRow}
                      isExpanded={isExpanded}
                      isSaving={isSaving}
                      isSelected={isSelected}
                      ariaRowIndex={vi.index + 2}
                      onToggle={handleToggle}
                      onSelect={selection.toggleRow}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
