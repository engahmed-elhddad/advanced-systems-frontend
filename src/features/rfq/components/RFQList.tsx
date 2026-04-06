'use client'

import { useMemo, useState } from 'react'
import { useRFQList } from '@/features/rfq/hooks/useRFQList'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { RFQRow } from '@/types/rfq'
import { RFQStatusBadge } from '@/features/rfq/components/RFQStatusBadge'

export function RFQList() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const { data, isLoading, isError, error, refetch } = useRFQList({ page, size: 20, status: status || undefined })

  const rows = data?.items ?? []

  const columns: TableColumn<RFQRow>[] = useMemo(
    () => [
      { key: 'reference', header: 'Reference' },
      { key: 'part_number', header: 'Part #' },
      { key: 'company', header: 'Company' },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <RFQStatusBadge status={r.status} />,
      },
      { key: 'created_at', header: 'Created' },
    ],
    []
  )

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'responded', label: 'Responded' },
      { value: 'closed', label: 'Closed' },
    ],
    []
  )

  if (isError) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : 'Failed to load RFQs'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          label="Status"
          name="status"
          options={statusOptions}
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        />
      </div>
      <Table<RFQRow>
        columns={columns}
        data={rows}
        loading={isLoading}
        rowKey={(r) => r.id}
      />
      <div className="flex justify-between text-sm text-[var(--color-foreground-muted)]">
        <span>
          Page {data?.page ?? page} / {data?.pages ?? 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-50"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-50"
            disabled={isLoading || (data != null && page >= data.pages)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
