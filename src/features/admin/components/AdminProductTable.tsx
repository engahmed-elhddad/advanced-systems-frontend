'use client'

import { useMemo, useState } from 'react'
import { useAdminProducts } from '@/features/admin/hooks/useAdminProducts'
import { Table, type TableColumn } from '@/components/ui/Table'
import type { ProductListItem } from '@/types/product'
import { ErrorBanner } from '@/components/shared/ErrorBanner'

export function AdminProductTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useAdminProducts({ page, size: 25 })

  const columns: TableColumn<ProductListItem>[] = useMemo(
    () => [
      { key: 'part_number', header: 'Part #' },
      { key: 'name', header: 'Name' },
      { key: 'brand', header: 'Brand' },
      {
        key: 'is_ready',
        header: 'Ready',
        render: (r) => (r.is_ready ? 'Yes' : 'No'),
      },
    ],
    []
  )

  if (isError) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : 'Failed to load admin products'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Table<ProductListItem>
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.part_number}
      />
      <div className="flex justify-between text-sm text-[var(--color-foreground-muted)]">
        <span>
          Page {data?.page ?? page} / {Math.max(data?.pages ?? 1, 1)}
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
