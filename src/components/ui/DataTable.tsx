'use client'

/* eslint-disable no-console -- intentional warnings for table misconfiguration and lenient row-id mode */

/**
 * TanStack `DataTable` — enterprise grid primitive.
 *
 * @example Basic client-side table
 * ```tsx
 * <DataTable
 *   tableId="orders.inbox"
 *   tenantId={tenantId}
 *   data={rows}
 *   columns={columns}
 *   getRowId={(row) => String(row.id)}
 * />
 * ```
 *
 * @example Server pagination + sorting (manual*)
 * ```tsx
 * <DataTable
 *   data={pageItems}
 *   columns={columns}
 *   getRowId={(row) => String(row.id)}
 *   manualPagination
 *   manualSorting
 *   pageCount={totalPages}
 *   totalRowCount={total}
 *   pagination={{ pageIndex: page - 1, pageSize: 20 }}
 *   onPaginationChange={(u) => setPage(applyPage(u).pageIndex + 1)}
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 * />
 * ```
 *
 * @example Row selection + custom bulk UI
 * ```tsx
 * <DataTable
 *   enableRowSelection
 *   rowSelection={sel}
 *   onRowSelectionChange={setSel}
 *   renderBulkToolbar={({ selectedCount, exportSelectedToCsv }) => (
 *     <>
 *       <span>{selectedCount} selected</span>
 *       <button type="button" onClick={() => exportSelectedToCsv()}>Export</button>
 *     </>
 *   )}
 *   {...common}
 * />
 * ```
 *
 * @example Column visibility persisted
 * ```tsx
 * <DataTable
 *   columnVisibilityStorageKey="admin.orders"
 *   columnVisibilityStorageVersion="1"
 *   {...common}
 * />
 * ```
 */

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table'
import { functionalUpdate, type Updater } from '@tanstack/table-core'
import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, Columns3, Download, ListRestart, Trash2, X } from 'lucide-react'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  DataTableErrorBoundary,
  type DataTableErrorReportPayload,
} from '@/components/ui/DataTableErrorBoundary'
import { DataTableVirtualBody } from '@/components/ui/DataTableVirtualBody'
import { useDataTableTheme } from '@/components/ui/DataTableThemeContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import type { DataTableThemeTokens } from '@/lib/dataTable/dataTableTheme'
import type { CsvExportColumn } from '@/lib/dataTable/exportRowsToCSV'
import { createScopedStorageKey } from '@/lib/dataTable/createScopedStorageKey'
import type { DataTableEvent, DataTableEventType } from '@/lib/dataTable/dataTableEvents'
import {
  readEnvelope,
  removeIfExpired,
  safeGetItem,
  writeEnvelope,
} from '@/lib/dataTable/dataTableStorageManager'
import { CSV_EXPORT_WARN_ROW_LIMIT, exportRowsToCSV } from '@/lib/dataTable/exportRowsToCSV'
import { invariant } from '@/lib/dataTable/invariant'
import { normalizeRowIdsForTable } from '@/lib/dataTable/normalizeRowIds'
import { canUseBulkAction, filterColumnsByRoles } from '@/lib/dataTable/dataTableRbac'
import { enforceTableIdRequired, registerDataTableInstance } from '@/lib/dataTable/tableIdRegistry'
import { cn } from '@/lib/utils'

const SELECTION_SOFT_WARN = 5_000

function devTableGroup(tableId: string | undefined, title: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return
  const label = tableId ? `[DataTable:${tableId}]` : '[DataTable]'
  // eslint-disable-next-line no-console -- dev diagnostics
  console.groupCollapsed(`${label} ${title}`)
  if (payload) {
    // eslint-disable-next-line no-console
    console.warn(payload)
  }
  // eslint-disable-next-line no-console
  console.groupEnd()
}

/** Registered bulk actions when not using a custom `renderBulkToolbar`. */
export type DataTableBulkAction<TData> = {
  id: string
  label: string
  variant?: 'secondary' | 'destructive'
  requiresConfirm?: boolean
  confirmTitle?: string
  confirmDescription?: string
  action: (ctx: { rows: TData[]; selectedRowIds: string[] }) => void | Promise<void>
}

// --- Column meta (documented for consumers extending ColumnDef.meta) ---------------------------

/**
 * Attach via `columnDef.meta` to style cells/headers and tune DataTable behavior.
 *
 * @example
 * ```ts
 * meta: {
 *   headerClassName: 'w-32',
 *   cellClassName: 'px-4',
 *   showInVisibilityMenu: true,
 * }
 * ```
 */
export type DataTableColumnMeta = {
  headerClassName?: string
  cellClassName?: string
  showInVisibilityMenu?: boolean
  dataTableSelectionColumn?: boolean
}

const defaultHeaderCell = 'py-3 font-semibold'

const checkboxClass =
  'h-4 w-4 rounded border-white/25 bg-white/10 text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus:ring-orange-400/40'

/** Rows must expose a stable `id` used by `getRowId: (row) => String(row.id)`. */
export type DataTableIdentifiableRow = { id: string | number }

function applyUpdater<T>(updater: Updater<T>, prev: T): T {
  return functionalUpdate(updater, prev)
}

type StoredVisibilityPayload = { v: string; visibility: VisibilityState }
type StoredSortingPayload = { v: string; sorting: SortingState }
type StoredSelectionPayload = { v: string; ids: string[] }

function parseVersionedVisibility(
  raw: string | null,
  expectedVersion: string | undefined,
): VisibilityState | undefined {
  if (raw == null) return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'visibility' in parsed) {
      const p = parsed as StoredVisibilityPayload
      if (expectedVersion != null && p.v !== expectedVersion) return undefined
      if (p.visibility && typeof p.visibility === 'object') return p.visibility
      return undefined
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as VisibilityState
    }
  } catch {
    return undefined
  }
  return undefined
}

function parseVersionedSorting(
  raw: string | null,
  expectedVersion: string | undefined,
): SortingState | undefined {
  if (raw == null) return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && parsed !== null && 'sorting' in parsed) {
      const p = parsed as StoredSortingPayload
      if (expectedVersion != null && p.v !== expectedVersion) return undefined
      return Array.isArray(p.sorting) ? p.sorting : undefined
    }
  } catch {
    return undefined
  }
  return undefined
}

function readVisibilityStorage(
  raw: string | null,
  expectedVersion: string | undefined,
): VisibilityState | undefined {
  const env = readEnvelope<{ visibility: VisibilityState }>(raw)
  if (
    env &&
    (expectedVersion == null || env.v === expectedVersion) &&
    env.payload?.visibility &&
    typeof env.payload.visibility === 'object' &&
    !Array.isArray(env.payload.visibility)
  ) {
    return env.payload.visibility
  }
  return parseVersionedVisibility(raw, expectedVersion)
}

function readSortingStorage(
  raw: string | null,
  expectedVersion: string | undefined,
): SortingState | undefined {
  const env = readEnvelope<{ sorting: SortingState }>(raw)
  if (
    env &&
    (expectedVersion == null || env.v === expectedVersion) &&
    Array.isArray(env.payload?.sorting)
  ) {
    return env.payload.sorting
  }
  return parseVersionedSorting(raw, expectedVersion)
}

function readSelectionStorage(raw: string | null, version: string): RowSelectionState | undefined {
  const env = readEnvelope<{ ids: string[] }>(raw)
  if (env && env.v === version && Array.isArray(env.payload?.ids)) {
    const rs: RowSelectionState = {}
    for (const id of env.payload.ids) rs[id] = true
    return rs
  }
  try {
    const p = JSON.parse(raw ?? '') as StoredSelectionPayload
    if (p && p.v === version && Array.isArray(p.ids)) {
      const rs: RowSelectionState = {}
      for (const id of p.ids) rs[id] = true
      return rs
    }
  } catch {
    return undefined
  }
  return undefined
}

function hasCustomSelectionColumn<TData>(columns: ColumnDef<TData, unknown>[]) {
  return columns.some(
    (c) =>
      c.id === '__dataTable_select' ||
      c.id === 'select' ||
      (c.meta as DataTableColumnMeta | undefined)?.dataTableSelectionColumn === true,
  )
}

function buildBuiltinSelectionColumn<TData>(opts: {
  totalRowCount?: number
  onSelectAllAcrossPages?: () => void
  crossPageSelectionActive?: boolean
}): ColumnDef<TData, unknown> {
  const { totalRowCount, onSelectAllAcrossPages, crossPageSelectionActive } = opts
  return {
    id: '__dataTable_select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <div className="flex flex-col items-start gap-1">
        <input
          type="checkbox"
          aria-label="Select all on this page"
          className={checkboxClass}
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected()
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          disabled={!table.getRowModel().rows.length}
        />
        {onSelectAllAcrossPages != null && totalRowCount != null && totalRowCount > 0 ? (
          <button
            type="button"
            className="max-w-[8rem] text-left text-[10px] font-normal normal-case text-orange-400/90 underline-offset-2 hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onSelectAllAcrossPages()
            }}
          >
            {crossPageSelectionActive
              ? `All ${totalRowCount} selected`
              : `Select all ${totalRowCount}`}
          </button>
        ) : null}
      </div>
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className={checkboxClass}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        disabled={!row.getCanSelect()}
        aria-label="Select row"
      />
    ),
    meta: {
      headerClassName: 'w-10 px-2',
      cellClassName: 'rounded-l-xl px-2 py-3.5 align-middle',
      showInVisibilityMenu: false,
      dataTableSelectionColumn: true,
    } satisfies DataTableColumnMeta,
  }
}

function DataTableSortHeader<TData>({
  header,
  children,
  enableMultiSort,
}: {
  header: Header<TData, unknown>
  children: ReactNode
  enableMultiSort: boolean
}) {
  const sorted = header.column.getIsSorted()
  const sortIndex = header.column.getSortIndex()
  if (!header.column.getCanSort()) {
    return <>{children}</>
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left font-semibold text-inherit hover:text-white/90"
      onClick={header.column.getToggleSortingHandler()}
    >
      <span>{children}</span>
      {enableMultiSort && sortIndex >= 0 ? (
        <span
          className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded bg-white/15 px-1 text-[10px] font-bold text-white/80"
          aria-hidden
        >
          {sortIndex + 1}
        </span>
      ) : null}
      <span className="sr-only">
        {sorted === 'asc' ? 'Sorted ascending' : sorted === 'desc' ? 'Sorted descending' : 'Not sorted'}
        {enableMultiSort ? ' Hold Shift and click to add a sort column.' : ''}
      </span>
      {sorted === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
      )}
    </button>
  )
}

function defsToCsvColumns<TData>(
  cols: ColumnDef<TData, unknown>[],
  formatCell?: (value: unknown, column: { id: string; header: string }) => string,
): CsvExportColumn<TData>[] {
  const out: CsvExportColumn<TData>[] = []
  for (const c of cols) {
    if (c.id === '__dataTable_select') continue
    const key = (c as { accessorKey?: string }).accessorKey
    if (typeof key !== 'string') continue
    const header = typeof c.header === 'string' ? c.header : c.id ?? key
    const colMeta = { id: key, header }
    out.push({
      id: key,
      header,
      value: (row) => {
        const v = (row as Record<string, unknown>)[key]
        if (formatCell) return formatCell(v, colMeta)
        if (v == null) return ''
        if (typeof v === 'object') return JSON.stringify(v)
        return v as string | number | boolean
      },
    })
  }
  return out
}

/** Serializable slice for saved views and server persistence. */
export type DataTableViewConfig = {
  columnVisibility: VisibilityState
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

export type DataTableSavedViewListItem = DataTableViewConfig & {
  id: string
  label?: string
  is_default?: boolean
}

/** Context passed to `renderBulkToolbar` — see DataTableProps. */
export type DataTableBulkToolbarContext<TData> = {
  table: Table<TData>
  selectedRows: TData[]
  selectedRowIds: string[]
  selectedCount: number
  clearSelection: () => void
  /** Clears sorting (controlled and internal). */
  resetSorting: () => void
  /** Returns false when there are no exportable accessor columns. */
  exportSelectedToCsv: (filename?: string) => boolean
  /** True while default bulk delete/export handlers run */
  bulkActionPending: boolean
}

export type DataTableProps<TData extends DataTableIdentifiableRow> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  /**
   * Stable string id per row (current page in server mode). Compile-time contract: `TData` extends {@link DataTableIdentifiableRow}.
   * Use `createGetRowId` from `@/lib/dataTable/createGetRowId` when rows expose `id: string | number`.
   */
  getRowId: (row: TData) => string
  /**
   * When true (default in development), invalid/duplicate ids throw.
   * When false (suggested default in production), issues are logged and fallbacks applied so the UI keeps working.
   */
  strictRowIdValidation?: boolean
  /**
   * Stable id per grid instance — required for storage namespacing, telemetry, and error reports.
   * @throws in development when missing/blank
   */
  tableId: string
  /** Multi-tenant scope for persisted keys (column visibility, sort, selection). */
  tenantId?: string
  userId?: string
  /** TTL for persisted table state envelopes (ms). Omit for no expiry. */
  storageTTL?: number
  /**
   * When true, hash-based ids may be used for invalid/duplicate rows (seed includes tableId + index).
   * When false (default), duplicate rows after the first are omitted with an explicit warning; invalid ids get deterministic non-hash fallbacks so rows are kept.
   */
  allowSyntheticRowIds?: boolean

  /** Merge overrides over `DataTableThemeProvider` / defaults */
  dataTableThemeOverride?: Partial<DataTableThemeTokens>

  tableClassName?: string
  headerRowClassName?: string
  bodyRowClassName?: string
  /** Per-row classes (e.g. stale / conflict highlight). Merged with `bodyRowClassName`. */
  getBodyRowClassName?: (row: TData) => string | undefined
  wrapperClassName?: string
  /** Sticky table header row */
  stickyHeader?: boolean

  /** Wrap subtree in {@link DataTableErrorBoundary} (default true). */
  errorBoundary?: boolean
  onTableErrorRetry?: () => void
  onTableError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Caps retry clicks on the error boundary fallback (default 5). */
  errorBoundaryMaxRetries?: number
  onErrorReport?: (payload: DataTableErrorReportPayload) => void
  getErrorReportExtras?: () => { dataSnapshot?: unknown; configSnapshot?: unknown }

  isLoading?: boolean
  loadingSkeletonRows?: number

  /** When `data.length === 0` and not loading */
  emptyState?: ReactNode
  /** e.g. filtered empty — takes precedence title-wise when both set */
  emptySearchState?: ReactNode

  enableSorting?: boolean
  enableMultiColumnSort?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  manualSorting?: boolean
  showClearSortControl?: boolean
  sortingStorageKey?: string
  sortingStorageVersion?: string
  /** Max columns when multi-sort is enabled (default 3). */
  maxMultiSortColumns?: number

  columnVisibilityStorageKey?: string
  columnVisibilityStorageVersion?: string
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  showColumnVisibilityToggle?: boolean

  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  /** Caps how many row ids are kept in selection state (default 10_000). */
  maxSelectedRows?: number
  /** Persist selection ids in localStorage (uncontrolled selection only). */
  selectionStorageKey?: string
  selectionStorageVersion?: string
  /**
   * When `page`, changing the page clears selection. When `all`, selection may span pages (with parent-driven ids).
   */
  selectionMode?: 'page' | 'all'
  /**
   * Serialized signature of filters/search; when it changes, selection is cleared (tenant-safe view resets).
   */
  dataViewSignature?: string
  renderBulkToolbar?: (ctx: DataTableBulkToolbarContext<TData>) => ReactNode

  /** Select every result on the server (parent merges ids into `rowSelection`). */
  onSelectAllAcrossPages?: () => void
  crossPageSelectionActive?: boolean

  /** Replaces default Export/Delete when set (and no `renderBulkToolbar`). */
  bulkActions?: DataTableBulkAction<TData>[]
  /** Called after a successful registry bulk action (e.g. show undo UI). */
  onBulkUndo?: (actionId: string, ctx: { rows: TData[]; selectedRowIds: string[] }) => void

  onBulkAction?: (
    action: string,
    ctx: { rows: TData[]; selectedRowIds: string[] },
  ) => void | Promise<void>
  /** Preset destructive action — opens confirm dialog when `confirmBulkDelete` */
  onBulkDelete?: (rows: TData[]) => void | Promise<void>
  confirmBulkDelete?: boolean
  showDefaultBulkExport?: boolean
  /** @deprecated use exportFileName */
  csvExportFilename?: string
  /** Download filename for CSV export (default `export.csv`) */
  exportFileName?: string
  onBulkSuccess?: (action: string, ctx: { rows: TData[]; selectedRowIds: string[] }) => void
  onBulkError?: (
    action: string,
    error: unknown,
    ctx: { rows: TData[]; selectedRowIds: string[] },
  ) => void

  /** For exports over CSV_EXPORT_WARN_ROW_LIMIT — offer server-side/streaming export */
  onExportLargeDataset?: () => Promise<void>
  /** CSV cell formatter (export only). */
  formatCell?: (value: unknown, column: { id: string; header: string }) => string

  manualPagination?: boolean
  manualFiltering?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  pageCount?: number
  totalRowCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageSize?: number

  /**
   * Opt-in row virtualization (uses @tanstack/react-virtual). Recommended for very large client-side pages.
   * When omitted, all rows render normally (server-paginated pages stay small).
   */
  enableVirtualization?: boolean
  virtualizeThreshold?: number
  virtualizationMaxHeight?: string
  /** Disable virtualization when row heights are not fixed (safer layout). */
  enableDynamicRowHeight?: boolean
  estimateRowHeight?: number

  stickyFirstColumn?: boolean
  onRowClick?: (row: TData, rowId: string) => void
  /** Arrow key focus navigation between rows (adds tabIndex on rows). */
  enableKeyboardNavigation?: boolean

  /** Dev: log render + row-model timings when a frame exceeds 16ms */
  enablePerformanceLogs?: boolean

  savedViews?: boolean
  onSaveView?: (config: DataTableViewConfig) => Promise<void>
  onLoadView?: () => Promise<DataTableSavedViewListItem[]>
  /**
   * When loaded from the server (e.g. default saved view), applied once for uncontrolled
   * visibility / sort / filters. Ignored if those facets are controlled.
   */
  serverHydratedView?: DataTableViewConfig | null

  /** Column id → roles that may see the column (omit id = visible to all). */
  columnPermissions?: Record<string, string[]>
  /** Bulk action id → roles (use `delete`, `export`, or custom registry ids). */
  actionPermissions?: Record<string, string[]>
  userRoles?: string[]

  onTableEvent?: (event: DataTableEvent) => void
  enableAnalytics?: boolean

  /** When this changes (e.g. refetch), selection is cleared to avoid stale ids. */
  dataVersion?: string | number
  /**
   * Shared counter for async bulk handlers — responses from stale requests are ignored.
   * If omitted, an internal ref is used.
   */
  latestRequestRef?: MutableRefObject<number>
  enableOptimisticUpdates?: boolean
}

function DataTableInner<TData extends DataTableIdentifiableRow>({
  data,
  columns,
  getRowId,
  strictRowIdValidation = process.env.NODE_ENV === 'development',
  tableId,
  tenantId,
  userId,
  storageTTL,
  allowSyntheticRowIds = false,
  dataTableThemeOverride,

  tableClassName,
  headerRowClassName,
  bodyRowClassName,
  getBodyRowClassName,
  wrapperClassName,
  stickyHeader = false,

  isLoading = false,
  loadingSkeletonRows = 5,

  emptyState,
  emptySearchState,

  enableSorting = false,
  enableMultiColumnSort = true,
  sorting: sortingControlled,
  onSortingChange: onSortingChangeControlled,
  manualSorting = false,
  showClearSortControl = true,
  sortingStorageKey,
  sortingStorageVersion,
  maxMultiSortColumns = 3,

  columnVisibilityStorageKey,
  columnVisibilityStorageVersion = '1',
  columnVisibility: columnVisibilityControlled,
  onColumnVisibilityChange: onColumnVisibilityChangeControlled,
  showColumnVisibilityToggle,

  enableRowSelection = false,
  rowSelection: rowSelectionControlled,
  onRowSelectionChange: onRowSelectionChangeControlled,
  maxSelectedRows = 10_000,
  selectionStorageKey,
  selectionStorageVersion = '1',
  selectionMode = 'page',
  dataViewSignature,
  renderBulkToolbar,

  onSelectAllAcrossPages,
  crossPageSelectionActive = false,

  bulkActions,
  onBulkUndo,

  onBulkAction,
  onBulkDelete,
  confirmBulkDelete = true,
  showDefaultBulkExport = false,
  csvExportFilename = 'export.csv',
  exportFileName,
  onBulkSuccess,
  onBulkError,

  onExportLargeDataset,
  formatCell,

  manualPagination = false,
  manualFiltering = false,
  columnFilters: columnFiltersControlled,
  onColumnFiltersChange: onColumnFiltersChangeControlled,
  pageCount: pageCountProp,
  totalRowCount,
  pagination: paginationControlled,
  onPaginationChange: onPaginationChangeControlled,
  pageSize: pageSizeProp,

  enableVirtualization,
  virtualizeThreshold = 100,
  virtualizationMaxHeight = 'min(70vh,560px)',
  enableDynamicRowHeight = false,
  estimateRowHeight = 56,

  stickyFirstColumn = false,
  onRowClick,
  enableKeyboardNavigation = false,

  enablePerformanceLogs = false,

  savedViews = false,
  onSaveView,
  onLoadView,
  serverHydratedView = null,

  columnPermissions,
  actionPermissions,
  userRoles,

  onTableEvent,
  enableAnalytics = false,

  dataVersion,
  latestRequestRef: latestRequestRefProp,
  enableOptimisticUpdates = false,
}: DataTableProps<TData>) {
  enforceTableIdRequired(tableId)

  if (typeof getRowId !== 'function') {
    throw new Error(`[DataTable:${tableId}] getRowId is required.`)
  }

  if (process.env.NODE_ENV === 'development') {
    const tid = tableId ? ` (tableId="${tableId}")` : ''
    if (manualPagination && onPaginationChangeControlled == null) {
      throw new Error(`[DataTable]${tid} manualPagination requires onPaginationChange.`)
    }
    if (manualSorting && enableSorting && onSortingChangeControlled == null) {
      throw new Error(`[DataTable]${tid} manualSorting with enableSorting requires onSortingChange.`)
    }
    if (manualFiltering && onColumnFiltersChangeControlled == null) {
      throw new Error(`[DataTable]${tid} manualFiltering requires onColumnFiltersChange.`)
    }
  }

  const baseTheme = useDataTableTheme()
  const themeTokens = useMemo(
    () => ({ ...baseTheme, ...(dataTableThemeOverride ?? {}) }),
    [baseTheme, dataTableThemeOverride],
  )

  useEffect(() => {
    const unregister = registerDataTableInstance(tableId)
    return unregister
  }, [tableId])

  const csvName = exportFileName ?? csvExportFilename

  const scopedColumnVisibilityKey = useMemo(
    () =>
      columnVisibilityStorageKey
        ? createScopedStorageKey(columnVisibilityStorageKey, { tenantId, userId })
        : null,
    [columnVisibilityStorageKey, tenantId, userId],
  )
  const scopedSortingKey = useMemo(
    () => (sortingStorageKey ? createScopedStorageKey(sortingStorageKey, { tenantId, userId }) : null),
    [sortingStorageKey, tenantId, userId],
  )
  const scopedSelectionKey = useMemo(
    () => (selectionStorageKey ? createScopedStorageKey(selectionStorageKey, { tenantId, userId }) : null),
    [selectionStorageKey, tenantId, userId],
  )

  const emitTableEvent = useCallback(
    (type: DataTableEventType, payload: Record<string, unknown>) => {
      if (!onTableEvent) return
      try {
        onTableEvent({ type, tableId, timestamp: Date.now(), payload })
      } catch {
        /* consumer */
      }
    },
    [onTableEvent, tableId],
  )

  const internalLatestRequestRef = useRef(0)
  const latestRequestRef = latestRequestRefProp ?? internalLatestRequestRef
  const nextAsyncRequestId = useCallback(() => {
    latestRequestRef.current += 1
    return latestRequestRef.current
  }, [latestRequestRef])
  const isLatestAsyncRequest = useCallback(
    (id: number) => latestRequestRef.current === id,
    [latestRequestRef],
  )

  const analyticsBucket = useRef({
    columnVisibility: {} as Record<string, number>,
    filters: {} as Record<string, number>,
    bulk: {} as Record<string, number>,
  })
  const analyticsFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleAnalyticsFlush = useCallback(() => {
    if (!enableAnalytics || !onTableEvent) return
    if (analyticsFlushTimer.current != null) return
    analyticsFlushTimer.current = setTimeout(() => {
      analyticsFlushTimer.current = null
      const b = analyticsBucket.current
      emitTableEvent('analytics_tick', {
        columnVisibility: { ...b.columnVisibility },
        filters: { ...b.filters },
        bulkActions: { ...b.bulk },
      })
    }, 2000)
  }, [enableAnalytics, onTableEvent, emitTableEvent])

  const bumpFilterAnalytics = useCallback(
    (filterId: string) => {
      if (!enableAnalytics) return
      const k = analyticsBucket.current.filters
      k[filterId] = (k[filterId] ?? 0) + 1
      scheduleAnalyticsFlush()
    },
    [enableAnalytics, scheduleAnalyticsFlush],
  )

  const bumpBulkAnalytics = useCallback(
    (actionId: string) => {
      if (!enableAnalytics) return
      const k = analyticsBucket.current.bulk
      k[actionId] = (k[actionId] ?? 0) + 1
      scheduleAnalyticsFlush()
    },
    [enableAnalytics, scheduleAnalyticsFlush],
  )

  const { data: tableData, getRowIdForTable } = useMemo(() => {
    const r = normalizeRowIdsForTable(data, getRowId, strictRowIdValidation, {
      tableId,
      allowSyntheticRowIds,
    })
    let d = r.data
    if (process.env.NODE_ENV === 'development') {
      d = Object.freeze(d.slice()) as TData[]
    }
    return { data: d, getRowIdForTable: r.getRowIdForTable }
  }, [data, getRowId, strictRowIdValidation, tableId, allowSyntheticRowIds])

  const prevDataRef = useRef(data)
  const prevIdSigRef = useRef('')
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const sig = tableData.map((r, i) => getRowIdForTable(r, i)).join('\u0001')
    if (prevIdSigRef.current !== '' && prevIdSigRef.current === sig && prevDataRef.current !== data) {
      devTableGroup(tableId, 'data → same row ids, new array reference (avoid wasted renders)', {
        rows: tableData.length,
      })
    }
    prevIdSigRef.current = sig
    prevDataRef.current = data
  }, [data, tableData, getRowIdForTable, tableId])

  const perfT0 = useRef(0)
  if (enablePerformanceLogs && process.env.NODE_ENV === 'development') {
    perfT0.current = performance.now()
  }
  useLayoutEffect(() => {
    if (!enablePerformanceLogs || process.env.NODE_ENV === 'production') return
    const ms = performance.now() - perfT0.current
    if (ms > 16) {
      devTableGroup(tableId, 'perf → render/layout slow', { ms: Math.round(ms * 10) / 10 })
    }
  })

  const dataChurnRef = useRef<{ windowStart: number; count: number }>({ windowStart: 0, count: 0 })
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const now = Date.now()
    const b = dataChurnRef.current
    if (now - b.windowStart > 2000) {
      b.windowStart = now
      b.count = 0
    }
    b.count += 1
    if (b.count > 24) {
      devTableGroup(tableId, 'performance → data prop reference churn', {
        hint: 'Stabilize `data` with useMemo when parents re-create the array each render.',
      })
      b.count = 0
      b.windowStart = now
    }
  }, [data, tableId])

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (tableData.length > 25_000) {
      devTableGroup(tableId, 'memory → very large client-side page (prefer server pagination / virtualization)', {
        rows: tableData.length,
      })
    }
  }, [tableData.length, tableId])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (sortingStorageKey && !enableSorting) {
      devTableGroup(tableId, 'misconfiguration → sortingStorageKey without enableSorting', {
        sortingStorageKey,
      })
    }
  }, [sortingStorageKey, enableSorting, tableId])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (enableVirtualization && stickyHeader) {
      devTableGroup(tableId, 'layout → virtualization disabled (stickyHeader)', {
        reason: 'Virtualized tbody layout is incompatible with sticky header in this implementation.',
      })
    }
  }, [enableVirtualization, stickyHeader, tableId])

  const rbacColumns = useMemo(
    () => filterColumnsByRoles(columns, userRoles, columnPermissions),
    [columns, userRoles, columnPermissions],
  )

  const mergedColumns = useMemo(() => {
    if (!enableRowSelection || hasCustomSelectionColumn(rbacColumns)) {
      return rbacColumns
    }
    return [
      buildBuiltinSelectionColumn<TData>({
        totalRowCount,
        onSelectAllAcrossPages,
        crossPageSelectionActive,
      }),
      ...rbacColumns,
    ] as ColumnDef<TData, unknown>[]
  }, [rbacColumns, enableRowSelection, totalRowCount, onSelectAllAcrossPages, crossPageSelectionActive])

  const visibleBulkActions = useMemo(() => {
    if (!bulkActions?.length) return bulkActions
    return bulkActions.filter((ba) => canUseBulkAction(ba.id, userRoles, actionPermissions))
  }, [bulkActions, userRoles, actionPermissions])

  const canDefaultBulkDelete = canUseBulkAction('delete', userRoles, actionPermissions)
  const canDefaultBulkExport = canUseBulkAction('export', userRoles, actionPermissions)

  const hideableColumnIds = useMemo(
    () =>
      mergedColumns
        .filter((c) => c.enableHiding !== false)
        .map((c) => String(c.id ?? (c as { accessorKey?: string }).accessorKey))
        .filter(Boolean),
    [mergedColumns],
  )

  const isVisibilityControlled =
    columnVisibilityControlled !== undefined && onColumnVisibilityChangeControlled !== undefined

  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>({})
  const [visibilityHydrated, setVisibilityHydrated] = useState(() => !columnVisibilityStorageKey)

  useEffect(() => {
    if (!scopedColumnVisibilityKey || isVisibilityControlled) return
    removeIfExpired(scopedColumnVisibilityKey)
    const raw = safeGetItem(scopedColumnVisibilityKey)
    const hadRaw = raw != null && raw.length > 0
    const stored = readVisibilityStorage(raw, columnVisibilityStorageVersion)
    if (hadRaw && stored === undefined && columnVisibilityStorageVersion) {
      try {
        const p = JSON.parse(raw!) as { v?: string }
        if (p && typeof p === 'object' && 'v' in p && p.v !== columnVisibilityStorageVersion) {
          devTableGroup(tableId, 'storage → columnVisibility version mismatch (cleared)', {
            storedVersion: p.v,
            expectedVersion: columnVisibilityStorageVersion,
          })
        } else if (p && typeof p === 'object' && !('visibility' in p) && (p as { dt?: number }).dt !== 1) {
          devTableGroup(tableId, 'storage → columnVisibility unrecognized shape', {
            key: scopedColumnVisibilityKey,
          })
        }
      } catch {
        devTableGroup(tableId, 'storage → columnVisibility parse failed after hydrate', {
          key: scopedColumnVisibilityKey,
        })
      }
    }
    if (stored) setInternalVisibility(stored)
    setVisibilityHydrated(true)
  }, [scopedColumnVisibilityKey, columnVisibilityStorageKey, columnVisibilityStorageVersion, isVisibilityControlled, tableId])

  const persistVisibility = useCallback(
    (next: VisibilityState) => {
      if (!scopedColumnVisibilityKey || isVisibilityControlled) return
      writeEnvelope(
        scopedColumnVisibilityKey,
        columnVisibilityStorageVersion ?? '1',
        { visibility: next },
        storageTTL,
      )
    },
    [scopedColumnVisibilityKey, columnVisibilityStorageVersion, isVisibilityControlled, storageTTL],
  )

  useEffect(() => {
    if (!scopedColumnVisibilityKey || isVisibilityControlled || !visibilityHydrated) {
      return
    }
    persistVisibility(internalVisibility)
  }, [internalVisibility, scopedColumnVisibilityKey, isVisibilityControlled, visibilityHydrated, persistVisibility])

  const columnVisibility = isVisibilityControlled ? columnVisibilityControlled : internalVisibility

  useEffect(() => {
    if (!visibilityHydrated || hideableColumnIds.length === 0) return
    const visibleCount = hideableColumnIds.filter((id) => columnVisibility[id] !== false).length
    if (visibleCount > 0) return
    devTableGroup(tableId, 'columnVisibility → invalid (all hidden), reset to defaults', {
      hideableColumnIds,
    })
    if (isVisibilityControlled && onColumnVisibilityChangeControlled) {
      onColumnVisibilityChangeControlled(() => ({}))
    } else if (!isVisibilityControlled) {
      setInternalVisibility({})
      persistVisibility({})
    }
  }, [
    visibilityHydrated,
    hideableColumnIds,
    columnVisibility,
    isVisibilityControlled,
    onColumnVisibilityChangeControlled,
    tableId,
    persistVisibility,
  ])

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updater) => {
      const patch = (old: VisibilityState) => {
        const next = applyUpdater(updater, old)
        if (hideableColumnIds.length > 0) {
          const visibleCount = hideableColumnIds.filter((id) => next[id] !== false).length
          if (visibleCount === 0) {
            devTableGroup(tableId, 'columnVisibility → refuse hide all', {})
            return old
          }
        }
        return next
      }
      if (isVisibilityControlled) {
        onColumnVisibilityChangeControlled!(patch)
      } else {
        setInternalVisibility(patch)
      }
    },
    [hideableColumnIds, isVisibilityControlled, onColumnVisibilityChangeControlled, tableId],
  )

  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [sortHydrated, setSortHydrated] = useState(() => !sortingStorageKey)

  useEffect(() => {
    if (!scopedSortingKey || sortingControlled !== undefined) return
    removeIfExpired(scopedSortingKey)
    const raw = safeGetItem(scopedSortingKey)
    const stored = readSortingStorage(raw, sortingStorageVersion)
    if (raw && raw.length > 0 && stored === undefined && sortingStorageVersion) {
      try {
        const p = JSON.parse(raw) as { v?: string }
        if (p && typeof p === 'object' && 'v' in p && p.v !== sortingStorageVersion) {
          devTableGroup(tableId, 'storage → sorting version mismatch (cleared)', {
            storedVersion: p.v,
            expectedVersion: sortingStorageVersion,
          })
        }
      } catch {
        devTableGroup(tableId, 'storage → sorting parse diagnostic failed', { key: scopedSortingKey })
      }
    }
    if (stored) setInternalSorting(stored)
    setSortHydrated(true)
  }, [scopedSortingKey, sortingStorageVersion, sortingControlled, tableId])

  useEffect(() => {
    if (!scopedSortingKey || sortingControlled !== undefined || !sortHydrated) return
    writeEnvelope(
      scopedSortingKey,
      sortingStorageVersion ?? '1',
      { sorting: internalSorting },
      storageTTL,
    )
  }, [internalSorting, scopedSortingKey, sortingStorageVersion, sortingControlled, sortHydrated, storageTTL])

  const sorting = sortingControlled ?? internalSorting
  const onSortingChangeBase = onSortingChangeControlled ?? setInternalSorting
  const onSortingChangeWrapped: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      if (!enableSorting) {
        onSortingChangeBase(updater)
        return
      }
      onSortingChangeBase((old) => {
        let next = applyUpdater(updater, old)
        if (enableMultiColumnSort && next.length > maxMultiSortColumns) {
          devTableGroup(tableId, 'sorting → maxMultiSortColumns trim', {
            maxMultiSortColumns,
            dropped: next.length - maxMultiSortColumns,
          })
          next = next.slice(0, maxMultiSortColumns)
        }
        return next
      })
    },
    [
      enableSorting,
      enableMultiColumnSort,
      maxMultiSortColumns,
      onSortingChangeBase,
      tableId,
    ],
  )

  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})
  const rowSelection = rowSelectionControlled ?? internalRowSelection
  const rowSelectionRef = useRef(rowSelection)
  rowSelectionRef.current = rowSelection

  const isRowSelectionControlled =
    rowSelectionControlled !== undefined && onRowSelectionChangeControlled !== undefined

  const onRowSelectionChangeWrapped: OnChangeFn<RowSelectionState> = useCallback(
    (updater) => {
      const inner = onRowSelectionChangeControlled ?? setInternalRowSelection
      inner((old) => {
        const next = applyUpdater(updater, old)
        const keys = Object.keys(next).filter((k) => next[k])
        if (keys.length > maxSelectedRows) {
          devTableGroup(tableId, 'selection → maxSelectedRows cap', {
            maxSelectedRows,
            requested: keys.length,
          })
          const trimmed: RowSelectionState = {}
          for (const k of keys.slice(0, maxSelectedRows)) trimmed[k] = true
          return trimmed
        }
        if (process.env.NODE_ENV === 'development' && keys.length > SELECTION_SOFT_WARN) {
          devTableGroup(tableId, 'selection → large (performance)', { count: keys.length })
        }
        return next
      })
    },
    [onRowSelectionChangeControlled, maxSelectedRows, tableId],
  )

  const clearSelectionCompat = useCallback(() => {
    if (isRowSelectionControlled && onRowSelectionChangeControlled) {
      onRowSelectionChangeControlled({})
    } else {
      setInternalRowSelection({})
    }
  }, [isRowSelectionControlled, onRowSelectionChangeControlled])

  const dataVersionMounted = useRef(false)
  const dataVersionRef = useRef(dataVersion)
  useEffect(() => {
    if (dataVersion === undefined) {
      dataVersionRef.current = dataVersion
      return
    }
    if (!dataVersionMounted.current) {
      dataVersionMounted.current = true
      dataVersionRef.current = dataVersion
      return
    }
    if (dataVersionRef.current === dataVersion) return
    dataVersionRef.current = dataVersion
    const prevSel = { ...rowSelectionRef.current }
    const had = Object.keys(prevSel).some((k) => prevSel[k])
    clearSelectionCompat()
    if (had) {
      const valid = new Set(tableData.map((row, i) => getRowIdForTable(row, i)))
      const ghost = Object.keys(prevSel).filter((id) => prevSel[id] && !valid.has(id))
      if (ghost.length > 0) {
        devTableGroup(tableId, 'dataVersion → selection cleared; some ids not in current page', {
          ghostSample: ghost.slice(0, 12),
        })
      }
    }
  }, [dataVersion, tableData, getRowIdForTable, clearSelectionCompat, tableId])

  const [selectionStorageHydrated, setSelectionStorageHydrated] = useState(
    () => !selectionStorageKey || rowSelectionControlled !== undefined,
  )

  useEffect(() => {
    if (!scopedSelectionKey || isRowSelectionControlled) return
    removeIfExpired(scopedSelectionKey)
    const raw = safeGetItem(scopedSelectionKey)
    if (raw) {
      const stored = readSelectionStorage(raw, selectionStorageVersion)
      if (stored) {
        setInternalRowSelection(stored)
      } else {
        devTableGroup(tableId, 'storage → selection unreadable or version mismatch', {
          key: scopedSelectionKey,
        })
      }
    }
    setSelectionStorageHydrated(true)
  }, [scopedSelectionKey, selectionStorageVersion, isRowSelectionControlled, tableId])

  useEffect(() => {
    if (!scopedSelectionKey || isRowSelectionControlled || !selectionStorageHydrated) return
    const ids = Object.keys(internalRowSelection).filter((k) => internalRowSelection[k])
    writeEnvelope(scopedSelectionKey, selectionStorageVersion, { ids }, storageTTL)
  }, [
    internalRowSelection,
    scopedSelectionKey,
    selectionStorageVersion,
    isRowSelectionControlled,
    selectionStorageHydrated,
    storageTTL,
  ])

  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])
  const columnFilters = columnFiltersControlled ?? internalColumnFilters
  const onColumnFiltersChangeBase = onColumnFiltersChangeControlled ?? setInternalColumnFilters

  const serverHydrateDone = useRef(false)
  useLayoutEffect(() => {
    if (serverHydrateDone.current || serverHydratedView == null) return
    if (isVisibilityControlled) {
      devTableGroup(tableId, 'serverHydratedView skipped (controlled columnVisibility)', {})
      serverHydrateDone.current = true
      return
    }
    if (sortingControlled !== undefined) {
      devTableGroup(tableId, 'serverHydratedView skipped (controlled sorting)', {})
      serverHydrateDone.current = true
      return
    }
    if (manualFiltering && columnFiltersControlled !== undefined) {
      devTableGroup(tableId, 'serverHydratedView skipped (controlled filters)', {})
      serverHydrateDone.current = true
      return
    }
    if (columnVisibilityStorageKey) {
      try {
        const sk = createScopedStorageKey(columnVisibilityStorageKey, { tenantId, userId })
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(sk) : null
        if (raw != null && raw.length > 2) {
          serverHydrateDone.current = true
          return
        }
      } catch {
        /* ignore */
      }
    }
    serverHydrateDone.current = true
    setInternalVisibility(serverHydratedView.columnVisibility ?? {})
    setInternalSorting(serverHydratedView.sorting ?? [])
    setInternalColumnFilters(serverHydratedView.columnFilters ?? [])
  }, [
    serverHydratedView,
    isVisibilityControlled,
    sortingControlled,
    manualFiltering,
    columnFiltersControlled,
    columnVisibilityStorageKey,
    tenantId,
    userId,
    tableId,
  ])

  const onColumnFiltersChangeForTable: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      clearSelectionCompat()
      onColumnFiltersChangeBase((old) => {
        const next = applyUpdater(updater, old)
        if (enableAnalytics) {
          for (const f of next) {
            bumpFilterAnalytics(String(f.id))
          }
        }
        return next
      })
    },
    [clearSelectionCompat, onColumnFiltersChangeBase, enableAnalytics, bumpFilterAnalytics],
  )

  const defaultPageSize = pageSizeProp ?? paginationControlled?.pageSize ?? 10
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const paginationForTable: PaginationState | undefined = manualPagination
    ? (paginationControlled ?? internalPagination)
    : undefined

  const pageSizeForCount =
    paginationForTable?.pageSize ?? paginationControlled?.pageSize ?? pageSizeProp ?? defaultPageSize

  const derivedPageCount =
    pageCountProp ??
    (manualPagination && totalRowCount != null && pageSizeForCount > 0
      ? Math.max(1, Math.ceil(totalRowCount / pageSizeForCount))
      : undefined)

  const resolvedPageCount = manualPagination ? derivedPageCount ?? 1 : undefined

  const onPaginationChangeResolved: OnChangeFn<PaginationState> | undefined = manualPagination
    ? (onPaginationChangeControlled ?? setInternalPagination)
    : undefined

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !manualPagination) return
    invariant(
      paginationControlled !== undefined,
      'manualPagination requires controlled `pagination` prop',
      tableId,
    )
    invariant(totalRowCount != null && totalRowCount >= 0, 'manualPagination requires totalRowCount', tableId)
  }, [manualPagination, paginationControlled, totalRowCount, tableId])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !manualPagination) return
    devTableGroup(tableId, 'server mode snapshot', {
      pageCount: resolvedPageCount,
      totalRowCount,
      pageIndex: paginationForTable?.pageIndex,
      pageSize: paginationForTable?.pageSize,
      manualSorting,
      manualFiltering,
    })
  }, [
    manualPagination,
    manualFiltering,
    manualSorting,
    resolvedPageCount,
    totalRowCount,
    paginationForTable?.pageIndex,
    paginationForTable?.pageSize,
    tableId,
  ])

  const viewSig = `${dataViewSignature ?? ''}\u0000${JSON.stringify(columnFilters)}`
  const prevViewSig = useRef<string | null>(null)
  useEffect(() => {
    if (prevViewSig.current === null) {
      prevViewSig.current = viewSig
      return
    }
    if (prevViewSig.current !== viewSig) {
      prevViewSig.current = viewSig
      clearSelectionCompat()
    }
  }, [viewSig, clearSelectionCompat])

  const prevPageIdx = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (selectionMode !== 'page' || !manualPagination) return
    const idx = paginationForTable?.pageIndex ?? 0
    if (prevPageIdx.current === undefined) {
      prevPageIdx.current = idx
      return
    }
    if (idx !== prevPageIdx.current) {
      prevPageIdx.current = idx
      clearSelectionCompat()
    }
  }, [selectionMode, manualPagination, paginationForTable?.pageIndex, clearSelectionCompat])

  const selectionEnabled = enableRowSelection || hasCustomSelectionColumn(mergedColumns)

  const shouldPruneStaleSelection =
    selectionEnabled && onSelectAllAcrossPages == null && !crossPageSelectionActive

  useEffect(() => {
    if (!shouldPruneStaleSelection) return
    const valid = new Set(tableData.map((row, i) => getRowIdForTable(row, i)))
    const sel = rowSelectionRef.current
    const stale = Object.keys(sel).filter((id) => sel[id] && !valid.has(id))
    if (stale.length === 0) return
    const patch = (prev: RowSelectionState) => {
      const next = { ...prev }
      for (const id of stale) {
        delete next[id]
      }
      return next
    }
    if (isRowSelectionControlled && onRowSelectionChangeControlled) {
      onRowSelectionChangeControlled(patch)
    } else {
      setInternalRowSelection(patch)
    }
  }, [shouldPruneStaleSelection, tableData, getRowIdForTable, isRowSelectionControlled, onRowSelectionChangeControlled])

  const getSortedRowModelFn =
    enableSorting && !manualSorting ? getSortedRowModel() : undefined

  const table = useReactTable({
    data: tableData,
    columns: mergedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      ...(paginationForTable ? { pagination: paginationForTable } : {}),
      ...(manualFiltering ? { columnFilters } : {}),
    },
    onSortingChange: onSortingChangeWrapped,
    onColumnVisibilityChange,
    onRowSelectionChange: onRowSelectionChangeWrapped,
    onPaginationChange: onPaginationChangeResolved,
    onColumnFiltersChange: manualFiltering ? onColumnFiltersChangeForTable : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModelFn,
    manualSorting,
    manualPagination,
    manualFiltering,
    pageCount: resolvedPageCount,
    getRowId: getRowIdForTable,
    enableSorting,
    enableMultiSort: enableSorting && enableMultiColumnSort,
    isMultiSortEvent: (e) => {
      if (!enableMultiColumnSort) return false
      const ne = (e as unknown as { shiftKey?: boolean }).shiftKey
      return Boolean(ne)
    },
    enableRowSelection: selectionEnabled,
    enableFilters: manualFiltering,
  })

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  )

  const sortEventPrimed = useRef(false)
  const prevSortingForEvent = useRef<SortingState>([])
  useEffect(() => {
    if (!sortEventPrimed.current) {
      sortEventPrimed.current = true
      prevSortingForEvent.current = sorting
      return
    }
    if (JSON.stringify(prevSortingForEvent.current) === JSON.stringify(sorting)) return
    prevSortingForEvent.current = sorting
    emitTableEvent('sort_changed', { sorting })
  }, [sorting, emitTableEvent])

  const filterEventPrimed = useRef(false)
  const prevFiltersForEvent = useRef<ColumnFiltersState>([])
  useEffect(() => {
    if (!manualFiltering) return
    if (!filterEventPrimed.current) {
      filterEventPrimed.current = true
      prevFiltersForEvent.current = columnFilters
      return
    }
    if (JSON.stringify(prevFiltersForEvent.current) === JSON.stringify(columnFilters)) return
    prevFiltersForEvent.current = columnFilters
    emitTableEvent('filter_changed', { columnFilters })
  }, [manualFiltering, columnFilters, emitTableEvent])

  const selectionEventPrimed = useRef(false)
  const prevSelectionSig = useRef('')
  useEffect(() => {
    const sig = selectedRowIds.slice().sort().join('\u0001')
    if (!selectionEventPrimed.current) {
      selectionEventPrimed.current = true
      prevSelectionSig.current = sig
      return
    }
    if (sig === prevSelectionSig.current) return
    prevSelectionSig.current = sig
    emitTableEvent('selection_changed', {
      selectedCount: selectedRowIds.length,
      selectedRowIdsSample: selectedRowIds.slice(0, 48),
    })
  }, [selectedRowIds, emitTableEvent])

  const colVisEventPrimed = useRef(false)
  const prevVisibilityForEvent = useRef<VisibilityState>({})
  useEffect(() => {
    if (!colVisEventPrimed.current) {
      colVisEventPrimed.current = true
      prevVisibilityForEvent.current = columnVisibility
      return
    }
    if (JSON.stringify(prevVisibilityForEvent.current) === JSON.stringify(columnVisibility)) return
    prevVisibilityForEvent.current = columnVisibility
    emitTableEvent('column_visibility_changed', { columnVisibility })
  }, [columnVisibility, emitTableEvent])

  const prevVisForAnalytics = useRef<VisibilityState>({})
  useEffect(() => {
    if (!enableAnalytics || !visibilityHydrated) return
    const prev = prevVisForAnalytics.current
    for (const id of hideableColumnIds) {
      if (prev[id] !== columnVisibility[id]) {
        analyticsBucket.current.columnVisibility[id] = (analyticsBucket.current.columnVisibility[id] ?? 0) + 1
        scheduleAnalyticsFlush()
      }
    }
    prevVisForAnalytics.current = { ...columnVisibility }
  }, [columnVisibility, hideableColumnIds, enableAnalytics, visibilityHydrated, scheduleAnalyticsFlush])

  const selectedRows = useMemo(() => {
    if (selectedRowIds.length === 0) return []
    const idSet = new Set(selectedRowIds)
    return tableData.filter((row, i) => idSet.has(getRowIdForTable(row, i)))
  }, [selectedRowIds, tableData, getRowIdForTable])

  const selectedCount = selectedRowIds.length

  const clearSelection = useCallback(() => {
    table.resetRowSelection()
  }, [table])

  const clearSorting = useCallback(() => {
    table.setSorting([])
  }, [table])

  const performClientCsvExport = useCallback(
    (filename = csvName): boolean => {
      const cols = defsToCsvColumns(mergedColumns, formatCell)
      if (cols.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          devTableGroup(tableId, 'export → no accessorKey columns', {})
        }
        return false
      }
      exportRowsToCSV(selectedRows, cols, filename, { warnAboveRows: CSV_EXPORT_WARN_ROW_LIMIT })
      emitTableEvent('export_triggered', { rowCount: selectedRows.length, filename })
      return true
    },
    [mergedColumns, formatCell, selectedRows, csvName, tableId, emitTableEvent],
  )

  const [largeExportOpen, setLargeExportOpen] = useState(false)
  const [registryPendingId, setRegistryPendingId] = useState<string | null>(null)
  const [bulkRegistryConfirm, setBulkRegistryConfirm] = useState<DataTableBulkAction<TData> | null>(null)
  const [bulkAnnounce, setBulkAnnounce] = useState('')
  const announceId = useId()
  const [savedViewsModalOpen, setSavedViewsModalOpen] = useState(false)
  const [savedViewList, setSavedViewList] = useState<DataTableSavedViewListItem[]>([])
  const [savedViewsLoading, setSavedViewsLoading] = useState(false)
  const savedViewsEnabled = Boolean(savedViews && onSaveView && onLoadView)

  const exportSelectedToCsv = useCallback(
    (filename = csvName): boolean => {
      if (selectedRows.length > CSV_EXPORT_WARN_ROW_LIMIT) {
        setLargeExportOpen(true)
        return false
      }
      return performClientCsvExport(filename)
    },
    [selectedRows.length, performClientCsvExport, csvName],
  )

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bulkActionPending, setBulkActionPending] = useState(false)

  const runBulkRegistry = useCallback(
    async (action: DataTableBulkAction<TData>) => {
      const ctx = { rows: selectedRows, selectedRowIds }
      const reqId = nextAsyncRequestId()
      setRegistryPendingId(action.id)
      setBulkAnnounce(`${action.label} started for ${selectedRowIds.length} row(s).`)
      let selectionSnapshot: RowSelectionState | undefined
      if (enableOptimisticUpdates && action.variant === 'destructive') {
        selectionSnapshot = { ...rowSelection }
        clearSelection()
      }
      try {
        await action.action(ctx)
        if (!isLatestAsyncRequest(reqId)) return
        onBulkSuccess?.(action.id, ctx)
        onBulkUndo?.(action.id, ctx)
        emitTableEvent('bulk_action_triggered', {
          actionId: action.id,
          selectedCount: selectedRowIds.length,
        })
        bumpBulkAnalytics(action.id)
        if (!enableOptimisticUpdates && action.variant === 'destructive') clearSelection()
        setBulkRegistryConfirm(null)
        setBulkAnnounce(`${action.label} completed.`)
      } catch (err) {
        if (!isLatestAsyncRequest(reqId)) return
        onBulkError?.(action.id, err, ctx)
        if (enableOptimisticUpdates && selectionSnapshot) {
          if (isRowSelectionControlled && onRowSelectionChangeControlled) {
            onRowSelectionChangeControlled(() => selectionSnapshot!)
          } else {
            setInternalRowSelection(selectionSnapshot)
          }
        }
        setBulkAnnounce(`${action.label} failed.`)
        if (process.env.NODE_ENV === 'development') {
          devTableGroup(tableId, 'bulk → registry action failed', {
            id: action.id,
            message: err instanceof Error ? err.message : String(err),
          })
        }
      } finally {
        if (isLatestAsyncRequest(reqId)) setRegistryPendingId(null)
      }
    },
    [
      selectedRows,
      selectedRowIds,
      rowSelection,
      nextAsyncRequestId,
      isLatestAsyncRequest,
      onBulkSuccess,
      onBulkError,
      onBulkUndo,
      clearSelection,
      tableId,
      emitTableEvent,
      bumpBulkAnalytics,
      enableOptimisticUpdates,
      isRowSelectionControlled,
      onRowSelectionChangeControlled,
    ],
  )

  const runBulkDelete = useCallback(async () => {
    if (bulkActionPending) return
    const rows = selectedRows
    const ctx = { rows, selectedRowIds }
    const reqId = nextAsyncRequestId()
    setBulkActionPending(true)
    setBulkAnnounce(`Delete started for ${selectedRowIds.length} row(s).`)
    let selectionSnapshot: RowSelectionState | undefined
    if (enableOptimisticUpdates) {
      selectionSnapshot = { ...rowSelection }
      clearSelection()
    }
    try {
      if (onBulkDelete) {
        await onBulkDelete(rows)
      } else {
        await onBulkAction?.('delete', ctx)
      }
      if (!isLatestAsyncRequest(reqId)) return
      onBulkSuccess?.('delete', ctx)
      emitTableEvent('bulk_action_triggered', { actionId: 'delete', selectedCount: selectedRowIds.length })
      bumpBulkAnalytics('delete')
      setDeleteModalOpen(false)
      if (!enableOptimisticUpdates) clearSelection()
      setBulkAnnounce('Delete completed.')
    } catch (err) {
      if (!isLatestAsyncRequest(reqId)) return
      onBulkError?.('delete', err, ctx)
      if (enableOptimisticUpdates && selectionSnapshot) {
        if (isRowSelectionControlled && onRowSelectionChangeControlled) {
          onRowSelectionChangeControlled(() => selectionSnapshot!)
        } else {
          setInternalRowSelection(selectionSnapshot)
        }
      }
      setBulkAnnounce('Delete failed.')
      if (process.env.NODE_ENV === 'development') {
        devTableGroup(tableId, 'bulk → delete failed', { message: err instanceof Error ? err.message : String(err) })
      }
    } finally {
      if (isLatestAsyncRequest(reqId)) setBulkActionPending(false)
    }
  }, [
    bulkActionPending,
    selectedRows,
    selectedRowIds,
    rowSelection,
    nextAsyncRequestId,
    isLatestAsyncRequest,
    onBulkDelete,
    onBulkAction,
    onBulkSuccess,
    onBulkError,
    clearSelection,
    tableId,
    emitTableEvent,
    bumpBulkAnalytics,
    enableOptimisticUpdates,
    isRowSelectionControlled,
    onRowSelectionChangeControlled,
  ])

  const runExportBulk = useCallback(async () => {
    if (bulkActionPending) return
    if (selectedRows.length > CSV_EXPORT_WARN_ROW_LIMIT) {
      setLargeExportOpen(true)
      return
    }
    const ctx = { rows: selectedRows, selectedRowIds }
    const reqId = nextAsyncRequestId()
    setBulkActionPending(true)
    setBulkAnnounce(`Export started for ${selectedRowIds.length} row(s).`)
    try {
      const exported = performClientCsvExport()
      if (!exported) {
        if (isLatestAsyncRequest(reqId)) setBulkActionPending(false)
        return
      }
      bumpBulkAnalytics('export')
      await onBulkAction?.('export', ctx)
      if (!isLatestAsyncRequest(reqId)) return
      onBulkSuccess?.('export', ctx)
      setBulkAnnounce('Export completed.')
    } catch (err) {
      if (!isLatestAsyncRequest(reqId)) return
      onBulkError?.('export', err, ctx)
      setBulkAnnounce('Export failed.')
      if (process.env.NODE_ENV === 'development') {
        devTableGroup(tableId, 'bulk → export failed', { message: err instanceof Error ? err.message : String(err) })
      }
    } finally {
      if (isLatestAsyncRequest(reqId)) setBulkActionPending(false)
    }
  }, [
    bulkActionPending,
    performClientCsvExport,
    selectedRows,
    selectedRowIds,
    nextAsyncRequestId,
    isLatestAsyncRequest,
    onBulkAction,
    onBulkSuccess,
    onBulkError,
    tableId,
    bumpBulkAnalytics,
  ])

  const showColumnsMenu =
    showColumnVisibilityToggle ??
    Boolean(columnVisibilityStorageKey && !isVisibilityControlled)

  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)

  const menuColumns = table
    .getAllLeafColumns()
    .filter((c) => c.getCanHide())
    .filter((c) => {
      const meta = c.columnDef.meta as DataTableColumnMeta | undefined
      return meta?.showInVisibilityMenu !== false
    })

  const sortingActive = sorting.length > 0

  const useBulkRegistry = Boolean(visibleBulkActions && visibleBulkActions.length > 0)
  const hasRbacDefaultDelete =
    (onBulkDelete != null || onBulkAction != null) && canDefaultBulkDelete
  const hasRbacDefaultExport = showDefaultBulkExport && canDefaultBulkExport
  const showDefaultBulk =
    selectionEnabled &&
    selectedCount > 0 &&
    renderBulkToolbar == null &&
    (useBulkRegistry || hasRbacDefaultDelete || hasRbacDefaultExport)

  const showToolbarRow =
    (showColumnsMenu && menuColumns.length > 0) ||
    (enableSorting && showClearSortControl && sortingActive) ||
    (renderBulkToolbar != null && selectedCount > 0) ||
    showDefaultBulk ||
    savedViewsEnabled

  const showBulkBar =
    (renderBulkToolbar != null && selectedCount > 0) || showDefaultBulk

  const resetColumnVisibility = useCallback(() => {
    if (isVisibilityControlled) {
      devTableGroup(tableId, 'columnVisibility → reset skipped (controlled mode)', {})
      return
    }
    setInternalVisibility({})
    persistVisibility({})
  }, [isVisibilityControlled, persistVisibility, tableId])

  const applyViewConfig = useCallback(
    (config: DataTableViewConfig) => {
      if (isVisibilityControlled && onColumnVisibilityChangeControlled) {
        onColumnVisibilityChangeControlled(() => config.columnVisibility)
      } else {
        setInternalVisibility(config.columnVisibility)
      }
      if (sortingControlled !== undefined && onSortingChangeControlled) {
        onSortingChangeControlled(() => config.sorting)
      } else {
        setInternalSorting(config.sorting)
      }
      if (manualFiltering && columnFiltersControlled !== undefined && onColumnFiltersChangeControlled) {
        onColumnFiltersChangeControlled(() => config.columnFilters)
      } else {
        setInternalColumnFilters(config.columnFilters)
      }
      clearSelectionCompat()
    },
    [
      isVisibilityControlled,
      onColumnVisibilityChangeControlled,
      sortingControlled,
      onSortingChangeControlled,
      manualFiltering,
      columnFiltersControlled,
      onColumnFiltersChangeControlled,
      clearSelectionCompat,
    ],
  )

  const resetTableView = useCallback(() => {
    applyViewConfig({ columnVisibility: {}, sorting: [], columnFilters: [] })
    clearSorting()
    setSavedViewsModalOpen(false)
  }, [applyViewConfig, clearSorting])

  const openSavedViewsModal = useCallback(() => {
    if (!onLoadView) return
    setSavedViewsModalOpen(true)
    setSavedViewsLoading(true)
    void onLoadView()
      .then((list) => setSavedViewList(list))
      .catch(() => setSavedViewList([]))
      .finally(() => setSavedViewsLoading(false))
  }, [onLoadView])

  const saveCurrentView = useCallback(() => {
    if (!onSaveView) return
    const config: DataTableViewConfig = {
      columnVisibility,
      sorting,
      columnFilters,
    }
    void onSaveView(config).catch(() => {})
  }, [onSaveView, columnVisibility, sorting, columnFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as Window & {
      __DATATABLE_DEVTOOLS__?: Record<
        string,
        {
          getState: () => Record<string, unknown>
          tableId: string
        }
      >
    }
    w.__DATATABLE_DEVTOOLS__ = w.__DATATABLE_DEVTOOLS__ ?? {}
    w.__DATATABLE_DEVTOOLS__[tableId] = {
      tableId,
      getState: () => ({
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        selectedRowIds,
        dataVersion,
      }),
    }
    return () => {
      delete w.__DATATABLE_DEVTOOLS__?.[tableId]
    }
  }, [tableId, sorting, columnFilters, columnVisibility, rowSelection, selectedRowIds, dataVersion])

  useEffect(
    () => () => {
      if (analyticsFlushTimer.current != null) clearTimeout(analyticsFlushTimer.current)
      setInternalRowSelection({})
    },
    [],
  )

  const rows = table.getRowModel().rows

  useLayoutEffect(() => {
    if (!enablePerformanceLogs || process.env.NODE_ENV === 'production') return
    const t0 = performance.now()
    table.getRowModel()
    const dt = performance.now() - t0
    if (dt > 16 && rows.length > 0) {
      devTableGroup(tableId, 'perf → getRowModel slow', {
        ms: Math.round(dt * 10) / 10,
        rows: rows.length,
      })
    }
  }, [table, rows.length, enablePerformanceLogs, tableId])
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1)
  const tableFocusRef = useRef<HTMLTableElement>(null)

  const handleTableKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableElement>) => {
      if (!enableKeyboardNavigation || rows.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedRowIndex((i) => {
          const next = i < 0 ? 0 : Math.min(rows.length - 1, i + 1)
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedRowIndex((i) => {
          const next = i < 0 ? 0 : Math.max(0, i - 1)
          return next
        })
      } else if (e.key === 'Home') {
        e.preventDefault()
        setFocusedRowIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setFocusedRowIndex(Math.max(0, rows.length - 1))
      }
    },
    [enableKeyboardNavigation, rows.length],
  )

  useLayoutEffect(() => {
    if (!enableKeyboardNavigation || focusedRowIndex < 0 || !tableFocusRef.current) return
    const el = tableFocusRef.current.querySelector<HTMLElement>(`[data-row-index="${focusedRowIndex}"]`)
    el?.focus()
  }, [enableKeyboardNavigation, focusedRowIndex, rows.length])

  const useVirtual =
    enableVirtualization === true &&
    !stickyHeader &&
    !enableDynamicRowHeight &&
    rows.length > virtualizeThreshold &&
    rows.length > 0 &&
    !isLoading

  const scrollParentRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    const colCount = mergedColumns.length || 6
    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        <table className={cn(themeTokens.table, tableClassName)}>
          <thead>
            <tr className={headerRowClassName}>
              {Array.from({ length: colCount }).map((_, i) => (
                <th key={i} className={cn(defaultHeaderCell, 'px-4')}>
                  <Skeleton className="mx-auto h-4 w-16 rounded bg-white/10" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingSkeletonRows }).map((_, r) => (
              <tr key={r}>
                <td colSpan={colCount} className="px-2 py-2">
                  <Skeleton className="h-14 w-full rounded-lg bg-white/10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (tableData.length === 0) {
    return (
      <div className={cn(themeTokens.emptyPanel, wrapperClassName)}>
        {emptySearchState ?? emptyState ?? <p>No data</p>}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      <div id={announceId} aria-live="polite" aria-atomic className="sr-only">
        {bulkAnnounce}
      </div>
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          if (!bulkActionPending) setDeleteModalOpen(false)
        }}
        title="Delete selected rows?"
        description="This action may be irreversible depending on your backend."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={bulkActionPending}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={bulkActionPending}
              onClick={() => void runBulkDelete()}
            >
              {bulkActionPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-white/70">
          You are about to delete {selectedCount} row(s). Continue?
        </p>
      </Modal>

      <Modal
        open={bulkRegistryConfirm != null}
        onClose={() => (registryPendingId == null ? setBulkRegistryConfirm(null) : undefined)}
        title={bulkRegistryConfirm?.confirmTitle ?? 'Confirm action'}
        description={bulkRegistryConfirm?.confirmDescription}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={registryPendingId != null}
              onClick={() => setBulkRegistryConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={bulkRegistryConfirm?.variant === 'destructive' ? 'destructive' : 'primary'}
              size="sm"
              disabled={registryPendingId != null}
              onClick={() => {
                if (bulkRegistryConfirm) void runBulkRegistry(bulkRegistryConfirm)
              }}
            >
              {registryPendingId != null ? 'Running…' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-white/70">
          Run “{bulkRegistryConfirm?.label}” on {selectedCount} selected row(s)?
        </p>
      </Modal>

      <Modal
        open={largeExportOpen}
        onClose={() => setLargeExportOpen(false)}
        title="Large export"
        description="This selection exceeds the recommended in-browser export size."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setLargeExportOpen(false)}>
              Cancel
            </Button>
            {onExportLargeDataset ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setLargeExportOpen(false)
                  void onExportLargeDataset()
                }}
              >
                Server / streaming export
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              surface="dark"
              onClick={() => {
                setLargeExportOpen(false)
                void performClientCsvExport()
              }}
            >
              Download CSV anyway
            </Button>
          </div>
        }
      >
        <p className="text-sm text-white/70">
          You selected {selectedRows.length.toLocaleString()} rows (recommended client limit{' '}
          {CSV_EXPORT_WARN_ROW_LIMIT.toLocaleString()}). Prefer a server-side or streaming export when
          available.
        </p>
      </Modal>

      {savedViewsEnabled ? (
        <Modal
          open={savedViewsModalOpen}
          onClose={() => setSavedViewsModalOpen(false)}
          title="Saved views"
          description="Apply a stored layout or save the current filters, sort, and columns."
          footer={
            <Button type="button" variant="secondary" size="sm" onClick={() => setSavedViewsModalOpen(false)}>
              Close
            </Button>
          }
        >
          {savedViewsLoading ? (
            <p className="text-sm text-white/60">Loading views…</p>
          ) : savedViewList.length === 0 ? (
            <p className="text-sm text-white/60">No saved views yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {savedViewList.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left text-orange-300/90 hover:bg-white/10"
                    onClick={() => {
                      applyViewConfig(v)
                      setSavedViewsModalOpen(false)
                    }}
                  >
                    {v.label ?? v.id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}

      {showToolbarRow ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            showBulkBar ? 'justify-between' : 'justify-end',
          )}
        >
          {showBulkBar ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {renderBulkToolbar != null && selectedCount > 0
                ? renderBulkToolbar({
                    table,
                    selectedRows,
                    selectedRowIds,
                    selectedCount,
                    clearSelection,
                    resetSorting: clearSorting,
                    exportSelectedToCsv,
                    bulkActionPending,
                  })
                : null}
              {showDefaultBulk ? (
                <>
                  <span className="text-xs text-white/55">{selectedCount} selected</span>
                  {useBulkRegistry ? (
                    visibleBulkActions!.map((ba) => (
                      <Button
                        key={ba.id}
                        type="button"
                        size="sm"
                        variant={ba.variant === 'destructive' ? 'destructive' : 'secondary'}
                        surface={ba.variant === 'destructive' ? undefined : 'dark'}
                        disabled={registryPendingId != null && registryPendingId !== ba.id}
                        loading={registryPendingId === ba.id}
                        onClick={() => {
                          if (ba.requiresConfirm) setBulkRegistryConfirm(ba)
                          else void runBulkRegistry(ba)
                        }}
                      >
                        {ba.label}
                      </Button>
                    ))
                  ) : (
                    <>
                      {showDefaultBulkExport && canDefaultBulkExport ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          surface="dark"
                          disabled={bulkActionPending}
                          leftIcon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => void runExportBulk()}
                        >
                          {bulkActionPending ? 'Exporting…' : 'Export CSV'}
                        </Button>
                      ) : null}
                      {(onBulkDelete != null || onBulkAction != null) && canDefaultBulkDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={bulkActionPending}
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => {
                            if (confirmBulkDelete) setDeleteModalOpen(true)
                            else void runBulkDelete()
                          }}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    surface="dark"
                    disabled={bulkActionPending || registryPendingId != null}
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {savedViewsEnabled ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  surface="dark"
                  leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                  onClick={() => void saveCurrentView()}
                >
                  Save view
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  surface="dark"
                  onClick={() => void openSavedViewsModal()}
                >
                  Load view
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  surface="dark"
                  leftIcon={<ListRestart className="h-3.5 w-3.5" />}
                  onClick={() => resetTableView()}
                >
                  Reset view
                </Button>
              </>
            ) : null}
            {enableSorting && showClearSortControl && sortingActive ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
                onClick={clearSorting}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear sort
              </button>
            ) : null}

            {showColumnsMenu && menuColumns.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
                  aria-expanded={columnsMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setColumnsMenuOpen((o) => !o)}
                >
                  <Columns3 className="h-3.5 w-3.5" aria-hidden />
                  Columns
                </button>
                {columnsMenuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default bg-transparent"
                      aria-label="Close column menu"
                      onClick={() => setColumnsMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-lg border border-white/10 bg-[#111827] py-1 shadow-xl"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-3 py-2 text-left text-xs text-orange-300/90 hover:bg-white/10"
                        onClick={() => {
                          resetColumnVisibility()
                          setColumnsMenuOpen(false)
                        }}
                      >
                        Reset columns
                      </button>
                      <div className="my-1 border-t border-white/10" role="separator" />
                      {menuColumns.map((column) => {
                        const cid = column.id
                        const visibleOthers = hideableColumnIds.filter(
                          (id) => id !== cid && columnVisibility[id] !== false,
                        ).length
                        const wouldHideLast = column.getIsVisible() && visibleOthers === 0
                        return (
                          <label
                            key={column.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
                          >
                            <input
                              type="checkbox"
                              className={checkboxClass}
                              checked={column.getIsVisible()}
                              disabled={wouldHideLast}
                              onChange={column.getToggleVisibilityHandler()}
                            />
                            <span className="truncate">
                              {typeof column.columnDef.header === 'string'
                                ? column.columnDef.header
                                : column.id}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={useVirtual ? scrollParentRef : undefined}
        className={cn(useVirtual && 'overflow-auto')}
        style={useVirtual ? { maxHeight: virtualizationMaxHeight } : undefined}
      >
        <table
          ref={tableFocusRef}
          role="grid"
          aria-rowcount={
            manualPagination && totalRowCount != null ? totalRowCount : rows.length
          }
          tabIndex={enableKeyboardNavigation ? 0 : undefined}
          onKeyDown={handleTableKeyDown}
          className={cn(
            themeTokens.table,
            useVirtual && 'table-fixed',
            enableKeyboardNavigation && 'outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50',
            tableClassName,
          )}
        >
          <thead
            className={cn(
              stickyHeader && 'sticky top-0 z-20 bg-inherit shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md',
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className={headerRowClassName}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
                  const canSort = enableSorting && header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const ariaSort =
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        defaultHeaderCell,
                        meta?.headerClassName ?? 'px-4',
                        stickyFirstColumn &&
                          headerIndex === 0 &&
                          'sticky left-0 z-[2] bg-inherit shadow-[1px_0_0_rgba(255,255,255,0.06)]',
                      )}
                      aria-sort={canSort ? ariaSort : undefined}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <DataTableSortHeader
                          header={header}
                          enableMultiSort={enableMultiColumnSort && enableSorting}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </DataTableSortHeader>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          {useVirtual ? (
            <DataTableVirtualBody
              rows={rows}
              scrollParentRef={scrollParentRef}
              estimateRowHeight={estimateRowHeight}
              overscan={12}
              theme={themeTokens}
              bodyRowClassName={bodyRowClassName}
              getBodyRowClassName={getBodyRowClassName}
              stickyFirstColumn={stickyFirstColumn}
              onRowClick={onRowClick}
              focusRingClass={themeTokens.focusRing}
              getNavIndex={() => focusedRowIndex}
              setNavIndex={setFocusedRowIndex}
              enableKeyboardNav={enableKeyboardNavigation}
              ariaSelectionEnabled={selectionEnabled}
            />
          ) : (
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.id}
                  data-row-index={ri}
                  tabIndex={enableKeyboardNavigation ? 0 : undefined}
                  className={cn(
                    themeTokens.bodyRow,
                    bodyRowClassName,
                    getBodyRowClassName?.(row.original),
                    row.getIsSelected() && themeTokens.rowSelected,
                    enableKeyboardNavigation && focusedRowIndex === ri && themeTokens.focusRing,
                  )}
                  onClick={() => {
                    if (enableKeyboardNavigation) setFocusedRowIndex(ri)
                    onRowClick?.(row.original, row.id)
                  }}
                  onFocus={() => enableKeyboardNavigation && setFocusedRowIndex(ri)}
                  role="row"
                  aria-selected={selectionEnabled ? row.getIsSelected() : undefined}
                >
                  {row.getVisibleCells().map((cell, ci) => {
                    const cmeta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          cmeta?.cellClassName,
                          stickyFirstColumn &&
                            ci === 0 &&
                            'sticky left-0 z-[1] bg-inherit shadow-[1px_0_0_rgba(255,255,255,0.06)]',
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

const MemoizedInner = memo(DataTableInner) as typeof DataTableInner

export function DataTable<TData extends DataTableIdentifiableRow>(props: DataTableProps<TData>) {
  const {
    errorBoundary = true,
    onTableErrorRetry,
    onTableError,
    errorBoundaryMaxRetries,
    onErrorReport,
    getErrorReportExtras,
    ...rest
  } = props

  const mergedErrorReportExtras = useCallback(() => {
    const fallback = {
      dataSnapshot: {
        rowCount: rest.data?.length ?? 0,
        dataVersion: rest.dataVersion,
        tableId: rest.tableId,
      },
      configSnapshot: {
        manualPagination: rest.manualPagination,
        manualSorting: rest.manualSorting,
        manualFiltering: rest.manualFiltering,
        tenantId: rest.tenantId,
      },
    }
    const custom = getErrorReportExtras?.()
    return {
      dataSnapshot: custom?.dataSnapshot ?? fallback.dataSnapshot,
      configSnapshot: custom?.configSnapshot ?? fallback.configSnapshot,
    }
  }, [
    getErrorReportExtras,
    rest.data,
    rest.dataVersion,
    rest.tableId,
    rest.manualPagination,
    rest.manualSorting,
    rest.manualFiltering,
    rest.tenantId,
  ])

  const core = <MemoizedInner {...rest} />
  if (!errorBoundary) return core
  return (
    <DataTableErrorBoundary
      onRetry={onTableErrorRetry}
      onError={onTableError}
      onErrorReport={onErrorReport}
      maxRetries={errorBoundaryMaxRetries}
      tableId={rest.tableId}
      getErrorReportExtras={mergedErrorReportExtras}
    >
      {core}
    </DataTableErrorBoundary>
  )
}
