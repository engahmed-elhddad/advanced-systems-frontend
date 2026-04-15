'use client'

import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Boxes, Download } from 'lucide-react'
import {
  type DataTableColumnMeta,
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Pagination,
  Skeleton,
} from '@/components/ui'
import type { DataTableErrorReportPayload } from '@/components/ui/DataTableErrorBoundary'
import {
  bulkDeleteAdminProducts,
  validateAdminProductExportIds,
} from '@/features/dataTable/dataTablePlatformApi'
import { useDataTablePlatform } from '@/features/dataTable/useDataTablePlatform'
import { formatDataTableSentryEvent } from '@/lib/dataTable/formatDataTableSentryEvent'
import { type ColumnDef, type RowSelectionState } from '@tanstack/react-table'
import { AdminQueryErrorCard } from '@/components/admin/AdminQueryErrorCard'
import { getApiErrorMessage } from '@/lib/api'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import {
  conflictProductIdsFromError,
  useAdminProducts,
  useDeleteAdminProduct,
  type AdminProduct,
  type AdminProductStatus,
} from '@/features/products/hooks/useProducts'
import toast from 'react-hot-toast'

const FALLBACK_IMAGE = 'https://placehold.co/80x80/111827/9CA3AF?text=No+Img'
const PAGE_SIZE = 20
const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || 'default').trim()

function ProductRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td colSpan={7} className="px-2 py-2">
            <Skeleton className="h-14 w-full rounded-lg bg-white/10" />
          </td>
        </tr>
      ))}
    </>
  )
}

/** Shared thead for loading / empty states (data rows use DataTable column headers). */
function AdminProductsTableHead(props: {
  allOnPageSelected: boolean
  toggleAllOnPage: () => void
  selectAllDisabled: boolean
}) {
  const { allOnPageSelected, toggleAllOnPage, selectAllDisabled } = props
  return (
    <thead>
      <tr className="text-left text-xs uppercase tracking-wider text-white/45">
        <th className="w-10 px-2 py-3 font-semibold">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/25 bg-white/10 text-orange-500 focus:ring-orange-400/40"
            checked={allOnPageSelected}
            onChange={toggleAllOnPage}
            disabled={selectAllDisabled}
            aria-label="Select all on this page"
          />
        </th>
        <th className="px-4 py-3 font-semibold">Image</th>
        <th className="px-4 py-3 font-semibold">Name</th>
        <th className="px-4 py-3 font-semibold">Brand</th>
        <th className="px-4 py-3 font-semibold">Category</th>
        <th className="px-4 py-3 font-semibold">Status</th>
        <th className="px-4 py-3 font-semibold">Actions</th>
      </tr>
    </thead>
  )
}

function statusVariant(status: AdminProductStatus) {
  return status === 'Active' ? 'success' : 'default'
}

export default function AdminProductsListPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialQ = searchParams.get('q') ?? ''
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const [inputQuery, setInputQuery] = useState(initialQ)
  const [page, setPage] = useState(initialPage)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [staleRowIds, setStaleRowIds] = useState<Set<number>>(() => new Set())
  const prevDebounced = useRef(initialQ)

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const p = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    setInputQuery(q)
    setPage(p)
  }, [searchParams])

  const debouncedQuery = useDebouncedValue(inputQuery, 300)

  useEffect(() => {
    if (prevDebounced.current !== debouncedQuery) {
      setPage(1)
      prevDebounced.current = debouncedQuery
    }
  }, [debouncedQuery])

  useEffect(() => {
    setStaleRowIds(new Set())
  }, [debouncedQuery, page])

  const syncUrl = useCallback(() => {
    const p = new URLSearchParams()
    const q = debouncedQuery.trim()
    if (q) p.set('q', q)
    if (page > 1) p.set('page', String(page))
    const next = p.toString()
    const cur = searchParams.toString()
    if (next === cur) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [debouncedQuery, page, pathname, router, searchParams])

  useEffect(() => {
    syncUrl()
  }, [syncUrl])

  const productsQuery = useAdminProducts({
    page,
    size: PAGE_SIZE,
    search: debouncedQuery.trim() || undefined,
  })
  const dtPlatform = useDataTablePlatform({
    tableId: 'admin.products.catalog',
    tenantId: TENANT_ID,
  })
  const deleteMutation = useDeleteAdminProduct()

  useEffect(() => {
    if (productsQuery.isError) {
      toast.error(getApiErrorMessage(productsQuery.error, 'Failed to load products'))
    }
  }, [productsQuery.isError, productsQuery.error])

  const items = productsQuery.data?.items ?? []
  const total = productsQuery.data?.total ?? 0
  const catalogDataVersion = productsQuery.data?.dataVersion
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const itemIdsKey = items.map((p) => p.id).join(',')

  useEffect(() => {
    const allowed = new Set(items.map((p) => String(p.id)))
    setRowSelection((prev) => {
      const next = { ...prev }
      let dirty = false
      for (const k of Object.keys(next)) {
        if (!allowed.has(k)) {
          delete next[k]
          dirty = true
        }
      }
      return dirty ? next : prev
    })
  }, [itemIdsKey])

  const allOnPageSelected =
    items.length > 0 && items.every((p) => rowSelection[String(p.id)])

  function toggleAllOnPage() {
    if (allOnPageSelected) {
      setRowSelection((prev) => {
        const next = { ...prev }
        for (const p of items) {
          delete next[String(p.id)]
        }
        return next
      })
    } else {
      setRowSelection((prev) => {
        const next = { ...prev }
        for (const p of items) {
          next[String(p.id)] = true
        }
        return next
      })
    }
  }

  async function onDelete(product: AdminProduct) {
    if (!product._etag) {
      toast.error('Missing row version; refresh the page.')
      return
    }
    setDeletingId(product.id)
    try {
      await deleteMutation.mutateAsync({ id: product.id, etag: product._etag })
      toast.success('Product deleted')
      setRowSelection((prev) => {
        const next = { ...prev }
        delete next[String(product.id)]
        return next
      })
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 412 || error.response?.status === 428)
      ) {
        return
      }
      toast.error(getApiErrorMessage(error, 'Failed to delete product'))
    } finally {
      setDeletingId(null)
    }
  }

  async function onBulkDelete() {
    const ids = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map(Number)
    if (ids.length === 0) return
    if (!window.confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return
    const selectedRows = ids
      .map((id) => items.find((p) => p.id === id))
      .filter((p): p is AdminProduct => Boolean(p))
    if (selectedRows.some((p) => !p._etag)) {
      toast.error('Some rows are missing a version token. Refresh the page.')
      return
    }
    try {
      const result = await bulkDeleteAdminProducts(
        selectedRows.map((p) => ({ id: p.id, etag: p._etag! })),
        {
          expectedDataVersion: catalogDataVersion,
          search: debouncedQuery.trim() || undefined,
        },
      )
      if (result.deleted > 0) toast.success(`${result.deleted} product(s) deleted`)
      if (result.skipped?.length) {
        if (result.deleted > 0) {
          toast.error('Some rows were skipped because they changed on the server.')
        } else {
          toast.error('Some items are outdated. Data refreshed.')
        }
        setStaleRowIds(new Set(result.skipped.map((s) => s.id)))
        setRowSelection({})
        await productsQuery.refetch()
        return
      }
      setRowSelection({})
      await productsQuery.refetch()
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 412) {
        toast.error('Some items are outdated. Data refreshed.')
        const conflictIds = conflictProductIdsFromError(e)
        setStaleRowIds(new Set(conflictIds.length ? conflictIds : ids))
        setRowSelection({})
        await productsQuery.refetch()
        return
      }
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        toast.error(getApiErrorMessage(e, 'Catalog changed. Refresh and try again.'))
        setRowSelection({})
        await productsQuery.refetch()
        return
      }
      toast.error(getApiErrorMessage(e, 'Bulk delete failed'))
    }
  }

  const selectAllDisabled = items.length === 0 || productsQuery.isLoading

  const productColumns: ColumnDef<AdminProduct>[] = [
    {
      id: 'image',
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: ({ row }) => (
        <Image
          src={row.original.imageUrl || FALLBACK_IMAGE}
          alt={row.original.name}
          width={48}
          height={48}
          loading="lazy"
          unoptimized
          className="h-12 w-12 rounded-md border border-white/10 object-cover"
        />
      ),
      meta: { cellClassName: 'px-4 py-3.5' } satisfies DataTableColumnMeta,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name,
      meta: { cellClassName: 'px-4 py-3.5 font-medium text-white' } satisfies DataTableColumnMeta,
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => row.original.brand,
      meta: { cellClassName: 'px-4 py-3.5 text-white/60' } satisfies DataTableColumnMeta,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category,
      meta: { cellClassName: 'px-4 py-3.5 text-white/60' } satisfies DataTableColumnMeta,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>,
      meta: { cellClassName: 'px-4 py-3.5' } satisfies DataTableColumnMeta,
    },
    {
      id: 'actions',
      enableHiding: false,
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              loading={deletingId === product.id}
              aria-label={`Delete ${product.name}`}
              onClick={() => void onDelete(product)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )
      },
      meta: { cellClassName: 'rounded-r-xl px-4 py-3.5' } satisfies DataTableColumnMeta,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="mt-1 text-sm text-gray-300">Manage your catalog with premium workflow controls.</p>
        </div>
        <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
          <Link href="/admin/products/new" aria-label="Add new product">
            Add Product
          </Link>
        </Button>
      </div>

      <Card hover={false} className="p-0" padding="none">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Search by product, brand, or category"
              aria-label="Search products"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <p className="mt-1.5 text-[11px] text-white/40">Results update after you stop typing (300ms).</p>
          </div>
        </div>
      </Card>

      {productsQuery.isError ? (
        <AdminQueryErrorCard
          message={getApiErrorMessage(productsQuery.error, 'Request failed')}
          onRetry={() => void productsQuery.refetch()}
          retrying={productsQuery.isFetching}
        />
      ) : null}

      <Card hover={false} className="p-0" padding="none">
        <div className="overflow-x-auto p-4">
          {productsQuery.isLoading ? (
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <AdminProductsTableHead
                allOnPageSelected={allOnPageSelected}
                toggleAllOnPage={toggleAllOnPage}
                selectAllDisabled={selectAllDisabled}
              />
              <tbody>
                <ProductRowsSkeleton />
              </tbody>
            </table>
          ) : items.length === 0 ? (
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <AdminProductsTableHead
                allOnPageSelected={allOnPageSelected}
                toggleAllOnPage={toggleAllOnPage}
                selectAllDisabled={selectAllDisabled}
              />
              <tbody>
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-gray-300">
                      <div className="rounded-full border border-white/10 bg-white/5 p-3">
                        <Boxes className="h-6 w-6 text-white/70" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">
                          {debouncedQuery.trim() ? 'No matches for this search' : 'No products in this view'}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          {debouncedQuery.trim()
                            ? 'Try another keyword or clear the search to see the full catalog slice.'
                            : 'Add a product or import a CSV to populate the catalog.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {debouncedQuery.trim() ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => setInputQuery('')}>
                            Clear search
                          </Button>
                        ) : null}
                        <Button asChild size="sm" variant="primary">
                          <Link href="/admin/products/new">Add product</Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                          <Link href="/products">View storefront catalog</Link>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <DataTable
              tableId="admin.products.catalog"
              tenantId={TENANT_ID}
              data={items}
              columns={productColumns}
              headerRowClassName="text-left text-xs uppercase tracking-wider text-white/45"
              bodyRowClassName="group text-white/90 transition-all duration-300 [&>td]:bg-white/[0.04] [&>td]:backdrop-blur-sm hover:[&>td]:bg-white/[0.09]"
              getBodyRowClassName={(row) =>
                staleRowIds.has(row.id)
                  ? 'ring-1 ring-amber-400/55 bg-amber-500/10'
                  : undefined
              }
              getRowId={(row) => String(row.id)}
              enableRowSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              columnVisibilityStorageKey="admin.products.table.columns"
              columnVisibilityStorageVersion="1"
              savedViews
              onSaveView={dtPlatform.saveView}
              onLoadView={dtPlatform.loadViews}
              onTableEvent={dtPlatform.onTableEvent}
              serverHydratedView={dtPlatform.defaultServerView}
              dataVersion={catalogDataVersion ?? productsQuery.dataUpdatedAt}
              onErrorReport={(payload: DataTableErrorReportPayload) => {
                const structured = formatDataTableSentryEvent({
                  error: payload.error,
                  kind: payload.kind,
                  errorInfo: payload.errorInfo,
                  tableId: payload.tableId,
                  dataSnapshot: payload.dataSnapshot,
                  configSnapshot: payload.configSnapshot,
                })
                if (process.env.NODE_ENV === 'development') {
                  // eslint-disable-next-line no-console -- intentional dev monitoring
                  console.warn('[DataTable monitoring]', structured)
                }
                const url = process.env.NEXT_PUBLIC_DATATABLE_MONITOR_URL
                if (url && typeof navigator !== 'undefined' && navigator.sendBeacon) {
                  navigator.sendBeacon(url, new Blob([JSON.stringify(structured)], { type: 'application/json' }))
                }
              }}
              renderBulkToolbar={({
                selectedCount,
                clearSelection,
                exportSelectedToCsv,
                selectedRowIds,
              }) => (
                <>
                  <span className="text-xs text-white/55">{selectedCount} selected</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    surface="dark"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={() => {
                      void (async () => {
                        try {
                          const ids = selectedRowIds
                            .map((id) => Number(id))
                            .filter((n) => Number.isFinite(n))
                          if (ids.length > 0) {
                            await validateAdminProductExportIds(ids, {
                              expectedDataVersion: catalogDataVersion,
                              search: debouncedQuery.trim() || undefined,
                            })
                          }
                          exportSelectedToCsv('admin-products-selected.csv')
                        } catch (e) {
                          toast.error(getApiErrorMessage(e, 'Export not allowed'))
                        }
                      })()
                    }}
                  >
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    onClick={() => void onBulkDelete()}
                  >
                    Delete selected
                  </Button>
                  <Button type="button" size="sm" variant="secondary" surface="dark" onClick={clearSelection}>
                    Clear
                  </Button>
                </>
              )}
              manualPagination
              pageCount={totalPages}
              totalRowCount={total}
              pagination={{ pageIndex: page - 1, pageSize: PAGE_SIZE }}
              onPaginationChange={(updater) => {
                const prev = { pageIndex: page - 1, pageSize: PAGE_SIZE }
                const next = typeof updater === 'function' ? updater(prev) : updater
                setPage(next.pageIndex + 1)
              }}
            />
          )}
        </div>
        {!productsQuery.isError && !productsQuery.isLoading && items.length > 0 ? (
          <div className="border-t border-white/10 px-4 py-4">
            <Pagination variant="dark" page={page} totalPages={totalPages} onPageChange={setPage} />
            <p className="mt-2 text-center text-[11px] text-white/40">
              Showing {items.length} of {total} products
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
