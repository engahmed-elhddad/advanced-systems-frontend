'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  editStagedRow,
  getIngestionJobDetail,
  ingestionBulkAction,
  publishIngestionJob,
  type BulkActionResponse,
  type IngestionJob,
  type JobDetailResponse,
  type PublishResponse,
  type StagedRow,
} from '@/services/adminService'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RowStatusFilter = 'all' | 'valid' | 'invalid' | 'duplicate' | 'approved' | 'published'

export interface JobFilters {
  statusFilter: RowStatusFilter
  fieldFilter: string | null
  searchQuery: string
  page: number
}

export interface JobActions {
  setStatusFilter: (status: RowStatusFilter) => void
  setFieldFilter: (field: string | null) => void
  setSearchQuery: (query: string) => void
  setPage: (page: number) => void
  setExpandedRowId: (id: number | null) => void
  resetFilters: () => void
}

export type BulkActionType = 'approve_selected' | 'reject_selected'

export interface BulkActionPayload {
  action: BulkActionType
  rowIds: number[]
}

export interface PublishPayload {
  jobId: number
}

export interface SelectionState {
  selectedRowIds: Set<number>
  isAllSelected: boolean
  toggleRow: (id: number) => void
  toggleAllOnPage: () => void
  clearSelection: () => void
}

export interface EditRowPayload {
  rowId: number
  data: {
    part_number?: string
    brand?: string
    category?: string
    stock_quantity?: number
    description?: string
    image_url?: string
    price?: number
  }
}

export interface UseJobDashboardReturn {
  job: IngestionJob | null
  rows: StagedRow[]
  statusCounts: Record<string, number>
  totalRowsFiltered: number
  isLoading: boolean
  isError: boolean
  expandedRowId: number | null
  filters: JobFilters
  actions: JobActions
  selection: SelectionState
  mutations: {
    approveAll: ReturnType<typeof useMutation<unknown, Error, void>>
    editRow: ReturnType<typeof useMutation<StagedRow, Error, EditRowPayload>>
    bulkAction: ReturnType<typeof useMutation<BulkActionResponse, Error, BulkActionPayload>>
    publish: ReturnType<typeof useMutation<PublishResponse, Error, void>>
  }
}

const DEBOUNCE_MS = 300

// ── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE = 50

/** Statuses that mean the pipeline is still actively processing — poll frequently. */
const ACTIVE_STATUSES = new Set(['parsing', 'validated'])

// ── Optimistic patch helper ───────────────────────────────────────────────────

function applyOptimisticPatch(
  row: StagedRow,
  patch: EditRowPayload['data'],
): StagedRow {
  return {
    ...row,
    part_number: patch.part_number ?? row.part_number,
    brand_raw: patch.brand ?? row.brand_raw,
    category_raw: patch.category ?? row.category_raw,
    stock_quantity: patch.stock_quantity ?? row.stock_quantity,
    description: patch.description ?? row.description,
    image_url: patch.image_url ?? row.image_url,
    price: patch.price ?? row.price,
    status: 'valid',
    validation_errors: [],
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useJobDashboard(jobId: number): UseJobDashboardReturn {
  const queryClient = useQueryClient()

  // ── Filter state ───────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilterRaw] = useState<RowStatusFilter>('all')
  const [fieldFilter, setFieldFilterRaw] = useState<string | null>(null)
  const [searchQuery, setSearchQueryRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPageRaw] = useState(1)
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)

  // ── Debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [searchQuery])

  // ── Compound setters: reset page + collapse on every filter change ────────
  const setStatusFilter = (next: RowStatusFilter) => {
    setStatusFilterRaw(next)
    setPageRaw(1)
    setExpandedRowId(null)
  }

  const setFieldFilter = (next: string | null) => {
    setFieldFilterRaw(next)
    setPageRaw(1)
    setExpandedRowId(null)
  }

  const setSearchQuery = (next: string) => {
    setSearchQueryRaw(next)
    setPageRaw(1)
    setExpandedRowId(null)
  }

  const setPage = (next: number) => {
    setPageRaw(next)
    setExpandedRowId(null)
  }

  const resetFilters = () => {
    setStatusFilterRaw('all')
    setFieldFilterRaw(null)
    setSearchQueryRaw('')
    setDebouncedSearch('')
    setPageRaw(1)
    setExpandedRowId(null)
  }

  // ── Server query — job detail + rows ─────────────────────────────────────
  // debouncedSearch (not searchQuery) drives the query key so we don't fetch
  // on every keystroke.
  const jobQuery = useQuery({
    queryKey: ['ingestion-job', jobId, statusFilter, debouncedSearch, page],
    queryFn: () =>
      getIngestionJobDetail(jobId, {
        page,
        per_page: PER_PAGE,
        row_status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status
      return status !== undefined && ACTIVE_STATUSES.has(status) ? 5000 : false
    },
    staleTime: 10_000,
  })

  // ── Client-side field filter ──────────────────────────────────────────────
  // status + search filtering is server-side. Field filtering runs
  // client-side on the current page until the backend adds a `field` param.
  const rows = useMemo<StagedRow[]>(() => {
    const allRows = jobQuery.data?.rows ?? []
    if (!fieldFilter) return allRows
    return allRows.filter((r) =>
      r.validation_errors.some((e) => e.field === fieldFilter),
    )
  }, [jobQuery.data?.rows, fieldFilter])

  // ── Selection state — persists across pages ────────────────────────────
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set())

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows])

  const isAllSelected = pageRowIds.length > 0 && pageRowIds.every((id) => selectedRowIds.has(id))

  const toggleRow = (id: number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllOnPage = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev)
      if (isAllSelected) {
        for (const id of pageRowIds) next.delete(id)
      } else {
        for (const id of pageRowIds) next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedRowIds(new Set())

  // ── Query helpers ─────────────────────────────────────────────────────────
  const jobQueryKeyPrefix = ['ingestion-job', jobId] as const
  const invalidateJob = () => {
    queryClient.invalidateQueries({ queryKey: [...jobQueryKeyPrefix] })
  }

  // ── Mutation: approve all valid rows ─────────────────────────────────────
  const approveAll = useMutation({
    mutationFn: () => ingestionBulkAction(jobId, 'approve_all_valid'),
    onSuccess: () => { clearSelection(); invalidateJob() },
  })

  // ── Mutation: edit a single staged row (with optimistic update) ─────────
  const editRow = useMutation<StagedRow, Error, EditRowPayload, { previous: [readonly unknown[], JobDetailResponse | undefined][] }>({
    mutationFn: ({ rowId, data }) => editStagedRow(rowId, data),

    onMutate: async ({ rowId, data }) => {
      await queryClient.cancelQueries({ queryKey: [...jobQueryKeyPrefix] })

      const matchingQueries = queryClient.getQueriesData<JobDetailResponse>({
        queryKey: [...jobQueryKeyPrefix],
      })

      const previous = matchingQueries.map(([key, value]) =>
        [key, value] as [readonly unknown[], JobDetailResponse | undefined],
      )

      for (const [key, cached] of matchingQueries) {
        if (!cached) continue
        queryClient.setQueryData<JobDetailResponse>(key as readonly unknown[], {
          ...cached,
          rows: cached.rows.map((row) =>
            row.id === rowId
              ? applyOptimisticPatch(row, data)
              : row,
          ),
        })
      }

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (!context?.previous) return
      for (const [key, snapshot] of context.previous) {
        queryClient.setQueryData(key, snapshot)
      }
    },

    onSuccess: (updatedRow) => {
      const matchingQueries = queryClient.getQueriesData<JobDetailResponse>({
        queryKey: [...jobQueryKeyPrefix],
      })
      for (const [key, cached] of matchingQueries) {
        if (!cached) continue
        queryClient.setQueryData<JobDetailResponse>(key as readonly unknown[], {
          ...cached,
          rows: cached.rows.map((row) =>
            row.id === updatedRow.id ? updatedRow : row,
          ),
        })
      }
    },

    onSettled: invalidateJob,
  })

  // ── Mutation: bulk approve/reject selected rows (optimistic for status) ──
  const bulkAction = useMutation<BulkActionResponse, Error, BulkActionPayload, { previous: [readonly unknown[], JobDetailResponse | undefined][] }>({
    mutationFn: ({ action, rowIds }) =>
      ingestionBulkAction(jobId, action, rowIds),

    onMutate: async ({ action, rowIds }) => {
      await queryClient.cancelQueries({ queryKey: [...jobQueryKeyPrefix] })

      const matchingQueries = queryClient.getQueriesData<JobDetailResponse>({
        queryKey: [...jobQueryKeyPrefix],
      })
      const previous = matchingQueries.map(([key, value]) =>
        [key, value] as [readonly unknown[], JobDetailResponse | undefined],
      )

      const targetStatus = action === 'approve_selected' ? 'approved' : 'rejected'
      const idSet = new Set(rowIds)

      for (const [key, cached] of matchingQueries) {
        if (!cached) continue
        queryClient.setQueryData<JobDetailResponse>(key as readonly unknown[], {
          ...cached,
          rows: cached.rows.map((row) =>
            idSet.has(row.id) ? { ...row, status: targetStatus } : row,
          ),
        })
      }

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (!context?.previous) return
      for (const [key, snapshot] of context.previous) {
        queryClient.setQueryData(key, snapshot)
      }
    },

    onSuccess: () => clearSelection(),
    onSettled: invalidateJob,
  })

  // ── Mutation: publish (NO optimistic — waits for server) ────────────────
  const publish = useMutation<PublishResponse, Error, void>({
    mutationFn: () => publishIngestionJob(jobId),
    onSuccess: () => clearSelection(),
    onSettled: invalidateJob,
  })

  return {
    job: jobQuery.data?.job ?? null,
    rows,
    statusCounts: jobQuery.data?.status_counts ?? {},
    totalRowsFiltered: jobQuery.data?.total_rows_filtered ?? 0,
    isLoading: jobQuery.isLoading,
    isError: jobQuery.isError,
    expandedRowId,
    filters: { statusFilter, fieldFilter, searchQuery, page },
    actions: { setStatusFilter, setFieldFilter, setSearchQuery, setPage, setExpandedRowId, resetFilters },
    selection: { selectedRowIds, isAllSelected, toggleRow, toggleAllOnPage, clearSelection },
    mutations: { approveAll, editRow, bulkAction, publish },
  }
}
