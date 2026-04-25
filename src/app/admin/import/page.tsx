'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Eye,
  Pencil,
  X,
  Check,
  ArrowLeft,
  RefreshCw,
  Send,
  Filter,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Badge, Modal, DataTable } from '@/components/ui'
import {
  getIngestionJobs,
  uploadIngestionFile,
  getIngestionJobDetail,
  ingestionBulkAction,
  editStagedRow,
  publishIngestionJob,
  type IngestionJob,
  type StagedRow,
  type UploadResponse,
} from '@/features/admin/services/adminService'
import toast from 'react-hot-toast'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const ACCEPTED_EXTS = ['.csv', '.xlsx', '.xls', '.ods']

// ── Status config ────────────────────────────────────────────────────────────

const JOB_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default' }> = {
  pending: { label: 'Pending', variant: 'pending' },
  parsing: { label: 'Parsing', variant: 'info' },
  validated: { label: 'Validated', variant: 'info' },
  reviewing: { label: 'Reviewing', variant: 'warning' },
  partially_approved: { label: 'Partial', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  processing: { label: 'Processing', variant: 'info' },
}

const ROW_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default' }> = {
  valid: { label: 'Valid', variant: 'success' },
  invalid: { label: 'Invalid', variant: 'error' },
  duplicate: { label: 'Duplicate', variant: 'warning' },
  approved: { label: 'Approved', variant: 'info' },
  rejected: { label: 'Rejected', variant: 'error' },
  published: { label: 'Published', variant: 'success' },
  pending: { label: 'Pending', variant: 'pending' },
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function BulkImportPage() {
  const [activeJobId, setActiveJobId] = useState<number | null>(null)

  if (activeJobId !== null) {
    return <JobDetailView jobId={activeJobId} onBack={() => setActiveJobId(null)} />
  }

  return <JobListView onSelectJob={setActiveJobId} />
}

// ── Job List View ────────────────────────────────────────────────────────────

function JobListView({ onSelectJob }: { onSelectJob: (id: number) => void }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['ingestion-jobs'],
    queryFn: () => getIngestionJobs({ per_page: 50 }),
    refetchInterval: 10_000,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadIngestionFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] })
      setUploadResult(data)
    },
  })

  const handleFile = useCallback(
    (file: File) => {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
      if (!ACCEPTED_EXTS.includes(ext)) {
        toast.error('Unsupported file type. Use CSV, XLSX, XLS, or ODS.')
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error('File too large. Maximum upload size is 20 MB.')
        return
      }
      setUploadResult(null)
      uploadMutation.mutate(file)
    },
    [uploadMutation],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const jobs = jobsData?.items ?? []

  const totalJobs = jobsData?.total ?? 0
  const pendingReview = jobs.filter((j) =>
    ['validated', 'reviewing', 'partially_approved'].includes(j.status),
  ).length
  const completedJobs = jobs.filter((j) => j.status === 'completed').length

  const jobColumns = useMemo<ColumnDef<IngestionJob & Record<string, unknown>, unknown>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-white/50">#{row.original.id}</span>
        ),
      },
      {
        id: 'filename',
        header: 'File',
        cell: ({ row }) => (
          <span className="font-medium text-white">{row.original.filename}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const st =
            JOB_STATUS_MAP[row.original.status] ?? {
              label: row.original.status,
              variant: 'default' as const,
            }
          return (
            <Badge variant={st.variant} size="sm">
              {st.label}
            </Badge>
          )
        },
      },
      {
        id: 'total_rows',
        header: 'Total',
        cell: ({ row }) => <span className="font-mono">{row.original.total_rows}</span>,
      },
      {
        id: 'valid_rows',
        header: 'Valid',
        cell: ({ row }) => (
          <span className="font-mono text-emerald-400">{row.original.valid_rows}</span>
        ),
      },
      {
        id: 'invalid_rows',
        header: 'Invalid',
        cell: ({ row }) => (
          <span className="font-mono text-red-400">{row.original.invalid_rows}</span>
        ),
      },
      {
        id: 'quality_score',
        header: 'Quality',
        cell: ({ row }) =>
          row.original.quality_score != null ? (
            <span className="font-mono text-orange-300">
              {Math.round((row.original.quality_score as number) * 100)}%
            </span>
          ) : (
            <span className="text-white/30">—</span>
          ),
      },
      {
        id: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-xs text-white/50">
            {row.original.created_at
              ? new Date(row.original.created_at as string).toLocaleDateString()
              : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Bulk Product Import</h1>
        <p className="mt-1 text-sm text-white/50">
          Upload CSV files to stage, validate, review, and publish products.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-[2px] border-2 border-dashed p-10 transition-colors',
          dragOver ? 'border-orange-400 bg-orange-400/10' : 'border-white/10 bg-white/[0.04]',
          uploadMutation.isPending && 'pointer-events-none opacity-60',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mb-3 h-8 w-8 text-white/50" />
        <p className="text-sm font-medium text-white">
          {uploadMutation.isPending
            ? 'Uploading & validating...'
            : 'Drop CSV, XLSX, or ODS file here or click to browse'}
        </p>
        <p className="mt-1 text-xs text-white/50">
          Accepted: .csv, .xlsx, .xls, .ods · Max 20 MB · Required column: part_number
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          loading={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Select File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.ods"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {uploadMutation.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {(uploadMutation.error as Error)?.message || 'Upload failed'}
        </div>
      )}

      {/* Upload result card */}
      {uploadResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                ✓ {uploadResult.filename} uploaded
              </p>
              <p className="mt-1 text-xs text-white/50">
                {uploadResult.total_rows} rows &middot; {uploadResult.valid_rows} valid &middot;{' '}
                {uploadResult.invalid_rows} invalid
                {uploadResult.quality_score != null &&
                  ` · Quality ${Math.round((uploadResult.quality_score as number) * 100)}%`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelectJob(uploadResult.job_id)}
              >
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setUploadResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Imports" value={totalJobs} />
        <SummaryCard label="Pending Review" value={pendingReview} color="text-amber-400" />
        <SummaryCard label="Completed" value={completedJobs} color="text-emerald-400" />
      </div>

      {/* Jobs Table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Import History</h2>
        <DataTable
          tableId="admin-import-jobs"
          columns={jobColumns}
          data={jobs as (IngestionJob & Record<string, unknown>)[]}
          isLoading={jobsLoading}
          getRowId={(row) => String(row.id)}
          stickyHeader
          onRowClick={(row) => onSelectJob(row.id)}
          emptyState={
            <p className="py-8 text-center text-sm text-white/50">
              No import jobs yet. Upload a file to get started.
            </p>
          }
        />
      </div>
    </div>
  )
}

// ── Job Detail View ──────────────────────────────────────────────────────────

function JobDetailView({ jobId, onBack }: { jobId: number; onBack: () => void }) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [editingRow, setEditingRow] = useState<StagedRow | null>(null)

  const {
    data,
    isLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['ingestion-job', jobId, statusFilter, page],
    queryFn: () =>
      getIngestionJobDetail(jobId, {
        page,
        per_page: 50,
        row_status: statusFilter || undefined,
      }),
    refetchInterval: 5_000,
  })

  const bulkMutation = useMutation({
    mutationFn: (params: { action: 'approve_all_valid' | 'approve_selected' | 'reject_selected' | 'delete_job'; rowIds?: number[] }) =>
      ingestionBulkAction(jobId, params.action, params.rowIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] })
      setSelectedRows(new Set())
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => publishIngestionJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: (params: { rowId: number; data: Record<string, unknown> }) =>
      editStagedRow(params.rowId, params.data),
    onSuccess: () => {
      setEditingRow(null)
      queryClient.invalidateQueries({ queryKey: ['ingestion-job', jobId] })
    },
  })

  const job = data?.job
  const rows = data?.rows ?? []

  useEffect(() => {
    if (!editingRow) return
    if (!rows.some((r) => r.id === editingRow.id)) {
      setEditingRow(null)
    }
  }, [rows, editingRow])

  const statusCounts = data?.status_counts ?? {}
  const totalFiltered = data?.total_rows_filtered ?? 0
  const totalPages = Math.max(1, Math.ceil(totalFiltered / 50))

  const approvedCount = statusCounts['approved'] ?? 0
  const hasApproved = approvedCount > 0
  const isCompleted = job?.status === 'completed'

  const toggleRow = useCallback((id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAllVisible = useCallback(() => {
    if (rows.every((r) => selectedRows.has(r.id))) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)))
    }
  }, [rows, selectedRows])

  const statusTabs = useMemo(() => {
    const tabs: { key: string; label: string; count: number }[] = [
      { key: '', label: 'All', count: job?.total_rows ?? 0 },
    ]
    for (const [k, v] of Object.entries(statusCounts)) {
      const label = ROW_STATUS_MAP[k]?.label ?? k
      tabs.push({ key: k, label, count: v })
    }
    return tabs
  }, [statusCounts, job?.total_rows])

  if (detailError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Failed to load job details.{' '}
          <button
            type="button"
            className="font-medium text-red-200 underline hover:no-underline"
            onClick={() => void refetchDetail()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-[2px] bg-white/10" />
        <div className="h-32 animate-pulse rounded-[2px] bg-white/10" />
        <div className="h-64 animate-pulse rounded-[2px] bg-white/10" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="py-12 text-center text-white/50">
        <p>Job not found.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  const jobSt = JOB_STATUS_MAP[job.status] ?? { label: job.status, variant: 'default' as const }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">
            {job.filename}
            <Badge variant={jobSt.variant} size="sm" className="ml-2">{jobSt.label}</Badge>
          </h1>
          <p className="mt-0.5 text-xs text-white/50">
            Job #{job.id} &middot; {job.created_at ? new Date(job.created_at).toLocaleString() : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void refetchDetail()} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Rows" value={job.total_rows} />
        <SummaryCard label="Valid" value={job.valid_rows} color="text-emerald-400" />
        <SummaryCard label="Invalid" value={job.invalid_rows} color="text-red-400" />
        <SummaryCard label="Approved" value={approvedCount} color="text-orange-400" />
      </div>

      {/* Validation Progress */}
      {job.total_rows > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-white/50">
            <span>Validation progress</span>
            <span>{Math.round(((statusCounts['valid'] ?? 0) / job.total_rows) * 100)}% valid</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round(((statusCounts['valid'] ?? 0) / job.total_rows) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => bulkMutation.mutate({ action: 'approve_all_valid' })}
          loading={bulkMutation.isPending}
          disabled={!statusCounts['valid']}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve All Valid ({statusCounts['valid'] ?? 0})
        </Button>

        {selectedRows.size > 0 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bulkMutation.mutate({ action: 'approve_selected', rowIds: [...selectedRows] })}
              loading={bulkMutation.isPending}
            >
              <Check className="h-4 w-4" />
              Approve Selected ({selectedRows.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkMutation.mutate({ action: 'reject_selected', rowIds: [...selectedRows] })}
              loading={bulkMutation.isPending}
            >
              <XCircle className="h-4 w-4" />
              Reject Selected ({selectedRows.size})
            </Button>
          </>
        )}

        <div className="flex-1" />

        {hasApproved && !isCompleted && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            <Send className="h-4 w-4" />
            Publish {approvedCount} Product{approvedCount !== 1 ? 's' : ''}
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Delete this entire import job and all staged rows?')) {
              bulkMutation.mutate({ action: 'delete_job' })
              onBack()
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Publish result */}
      {publishMutation.isSuccess && publishMutation.data && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          Published {publishMutation.data.published} product{publishMutation.data.published !== 1 ? 's' : ''} successfully.
          {publishMutation.data.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {publishMutation.data.errors.map((e, i) => (
                <li key={i} className="text-red-400">Row {e.row}: {e.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {bulkMutation.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {(bulkMutation.error as Error)?.message || 'Action failed'}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusFilter(tab.key)
              setPage(1)
            }}
            className={cn(
              'whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors',
              statusFilter === tab.key
                ? 'border-b-2 border-orange-400 text-orange-400'
                : 'text-white/50 hover:text-white',
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Rows Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="sticky top-0 z-10 border-b border-white/10 bg-[#030712]">
              <th className="w-8 px-2 py-2.5">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((r) => selectedRows.has(r.id))}
                  onChange={toggleAllVisible}
                  className="rounded-[2px]"
                  aria-label="Select all rows"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">#</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Part Number</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Brand</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Category</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-white/40">Stock</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Description</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Status</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">Errors</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/40" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-white/50">
                  No rows found for this filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rst = ROW_STATUS_MAP[row.status] ?? { label: row.status, variant: 'default' as const }
                const hasErrors = row.validation_errors && row.validation_errors.length > 0
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-white/[0.06] transition-colors',
                      selectedRows.has(row.id) ? 'bg-orange-400/10' : 'hover:bg-white/[0.04]',
                      hasErrors && 'bg-red-500/5',
                    )}
                  >
                    <td className="w-8 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="rounded-[2px]"
                        aria-label={`Select row ${row.row_number}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-white/50">{row.row_number}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-orange-300">{row.part_number ?? '—'}</td>
                    <td className="px-3 py-2 text-white">
                      {row.brand_raw ?? '—'}
                      {row.brand_raw && !row.brand_id && (
                        <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-white">
                      {row.category_raw ?? '—'}
                      {row.category_raw && !row.category_id && (
                        <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{row.stock_quantity}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-xs text-white/50">
                      {row.description || <span className="italic text-amber-500">Missing</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={rst.variant} size="sm">{rst.label}</Badge>
                    </td>
                    <td className="max-w-[180px] px-3 py-2">
                      {hasErrors ? (
                        <div className="space-y-0.5">
                          {row.validation_errors.map((e, i) => (
                            <p key={i} className="text-[11px] text-red-400">
                              {e.field}: {e.error}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-white/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="rounded-[2px] p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label={`Edit row ${row.row_number}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-white/50">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Inline Edit Modal */}
      {editingRow && (
        <EditRowModal
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={(rowId, editData) => editMutation.mutate({ rowId, data: editData })}
          saving={editMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = React.memo(function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', color ?? 'text-white')}>{value}</p>
    </div>
  )
})

// ── Edit Row Modal ───────────────────────────────────────────────────────────

function EditRowModal({
  row,
  onClose,
  onSave,
  saving,
}: {
  row: StagedRow
  onClose: () => void
  onSave: (rowId: number, data: Record<string, unknown>) => void
  saving: boolean
}) {
  const [partNumber, setPartNumber] = useState(row.part_number ?? '')
  const [brand, setBrand] = useState(row.brand_raw ?? '')
  const [category, setCategory] = useState(row.category_raw ?? '')
  const [stockQuantity, setStockQuantity] = useState(String(row.stock_quantity))
  const [description, setDescription] = useState(row.description ?? '')
  const [imageUrl, setImageUrl] = useState(row.image_url ?? '')
  const [price, setPrice] = useState(row.price != null ? String(row.price) : '')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSave(row.id, {
        part_number: partNumber,
        brand,
        category,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        description,
        image_url: imageUrl,
        price: price ? parseFloat(price) : 0,
      })
    },
    [row.id, partNumber, brand, category, stockQuantity, description, imageUrl, price, onSave],
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit Row #${row.row_number}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSubmit as () => void}>
            Save & Re-validate
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <FieldInput label="Part Number" value={partNumber} onChange={setPartNumber} required />
        <FieldInput label="Brand" value={brand} onChange={setBrand} />
        <FieldInput label="Category" value={category} onChange={setCategory} />
        <FieldInput label="Stock Quantity" value={stockQuantity} onChange={setStockQuantity} type="number" />
        <FieldInput label="Description" value={description} onChange={setDescription} multiline />
        <FieldInput label="Image URL" value={imageUrl} onChange={setImageUrl} />
        <FieldInput label="Price" value={price} onChange={setPrice} type="number" />
      </form>
    </Modal>
  )
}

// ── Field Input ──────────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  multiline?: boolean
}) {
  const id = React.useId()
  const inputCls =
    'w-full rounded-[2px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/20'

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-white/50">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputCls}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputCls}
        />
      )}
    </div>
  )
}
