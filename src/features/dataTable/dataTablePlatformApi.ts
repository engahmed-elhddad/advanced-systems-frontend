import { api } from '@/lib/api'
import type { DataTableSavedViewListItem, DataTableViewConfig } from '@/components/ui/DataTable'
import type { DataTableEvent } from '@/lib/dataTable/dataTableEvents'

/** API envelope from hardened admin routes */
function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    return (raw as { data: T }).data
  }
  return raw as T
}

export async function listSavedViews(tableId: string) {
  const res = await api.get<{ data: { items: DataTableSavedViewListItem[] }; meta?: Record<string, unknown> }>(
    '/api/v1/admin/data-table/saved-views',
    { params: { table_id: tableId } },
  )
  const inner = unwrap<{ items: DataTableSavedViewListItem[] }>(res.data)
  return { items: inner.items ?? [], meta: (res.data as { meta?: Record<string, unknown> }).meta }
}

export async function createSavedViewApi(input: {
  tableId: string
  label: string
  config: DataTableViewConfig
  makeDefault?: boolean
}) {
  await api.post('/api/v1/admin/data-table/saved-views', {
    table_id: input.tableId,
    label: input.label,
    config: {
      columnVisibility: input.config.columnVisibility,
      sorting: input.config.sorting,
      columnFilters: input.config.columnFilters,
    },
    make_default: input.makeDefault ?? false,
  })
}

export async function updateSavedViewApi(viewId: number, patch: { label?: string; config?: DataTableViewConfig }) {
  await api.patch(`/api/v1/admin/data-table/saved-views/${viewId}`, {
    label: patch.label,
    config: patch.config
      ? {
          columnVisibility: patch.config.columnVisibility,
          sorting: patch.config.sorting,
          columnFilters: patch.config.columnFilters,
        }
      : undefined,
  })
}

export async function deleteSavedViewApi(viewId: number) {
  await api.delete(`/api/v1/admin/data-table/saved-views/${viewId}`)
}

export async function setDefaultSavedViewApi(viewId: number) {
  await api.post(`/api/v1/admin/data-table/saved-views/${viewId}/default`)
}

export async function postAuditEvents(events: DataTableEvent[]) {
  if (events.length === 0) return
  await api.post('/api/v1/admin/data-table/audit', {
    events: events.map((e) => ({
      event_type: e.type,
      table_id: e.tableId,
      timestamp: e.timestamp,
      payload: e.payload,
    })),
  })
}

export async function postPerfMetric(input: {
  tableId?: string
  operation: string
  durationMs: number
  rowCount?: number
  extra?: Record<string, unknown>
}) {
  await api.post('/api/v1/admin/data-table/metrics', {
    table_id: input.tableId,
    operation: input.operation,
    duration_ms: input.durationMs,
    row_count: input.rowCount,
    extra: input.extra,
  })
}

export async function validateAdminProductExportIds(
  productIds: number[],
  opts?: {
    expectedDataVersion?: string
    search?: string
    brandId?: number
    categoryId?: number
    clientRequestId?: string
  },
) {
  await api.post('/api/v1/admin/products/validate-export-ids', {
    product_ids: productIds,
    expected_data_version: opts?.expectedDataVersion,
    search: opts?.search,
    brand_id: opts?.brandId,
    category_id: opts?.categoryId,
    client_request_id: opts?.clientRequestId,
  })
}

export type BulkDeleteRowRef = { id: number; etag: string }

export async function bulkDeleteAdminProducts(
  items: BulkDeleteRowRef[],
  opts?: {
    expectedDataVersion?: string
    search?: string
    brandId?: number
    categoryId?: number
    failFast?: boolean
  },
) {
  const res = await api.post<{
    data: {
      deleted: number
      tenant_id: string
      skipped?: { id: number; reason: string }[]
      conflict_count?: number
    }
  }>('/api/v1/admin/products/bulk-delete', {
    items: items.map((x) => ({ id: x.id, etag: x.etag })),
    fail_fast: opts?.failFast,
    expected_data_version: opts?.expectedDataVersion,
    search: opts?.search,
    brand_id: opts?.brandId,
    category_id: opts?.categoryId,
  })
  return unwrap<{
    deleted: number
    tenant_id: string
    skipped?: { id: number; reason: string }[]
    conflict_count?: number
  }>(res.data)
}
