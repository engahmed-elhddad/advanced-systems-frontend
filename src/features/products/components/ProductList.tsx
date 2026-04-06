'use client'

import { useMemo, useState } from 'react'
import { useProducts } from '@/features/products/hooks/useProducts'
import type { ProductListFilters } from '@/features/products/types'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import type { ProductListItem } from '@/types/product'

export interface ProductListProps {
  initialFilters?: Partial<ProductListFilters>
}

export function ProductList({ initialFilters }: ProductListProps) {
  const [filters, setFilters] = useState<ProductListFilters>({
    page: initialFilters?.page ?? 1,
    size: initialFilters?.size ?? 20,
    brand_id: initialFilters?.brand_id,
    category_id: initialFilters?.category_id,
    q: initialFilters?.q,
  })

  const { products, total, page, pages, isLoading, isError, error, refetch } = useProducts({
    page: filters.page,
    size: filters.size,
    brand_id: filters.brand_id,
    category_id: filters.category_id,
    search: filters.q,
  })

  const columns: TableColumn<ProductListItem>[] = useMemo(
    () => [
      { key: 'part_number', header: 'Part #' },
      { key: 'name', header: 'Name' },
      { key: 'brand', header: 'Brand' },
      { key: 'category', header: 'Category' },
      {
        key: 'price',
        header: 'Price',
        render: (row) => (row.price != null ? `$${row.price.toFixed(2)}` : '—'),
      },
    ],
    []
  )

  if (isError) {
    return (
      <ErrorBanner
        message={error instanceof Error ? error.message : 'Failed to load products'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Table<ProductListItem>
        columns={columns}
        data={products}
        loading={isLoading}
        rowKey={(row) => row.part_number}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-foreground-muted)]">
        <span>
          Page {page} of {Math.max(pages, 1)} · {total} items
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filters.page <= 1 || isLoading}
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || page >= pages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
