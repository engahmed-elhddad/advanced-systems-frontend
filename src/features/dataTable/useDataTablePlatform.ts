'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DataTableViewConfig } from '@/components/ui/DataTable'
import type { DataTableEvent } from '@/lib/dataTable/dataTableEvents'
import {
  createSavedViewApi,
  listSavedViews,
  postAuditEvents,
} from '@/features/dataTable/dataTablePlatformApi'

const AUDIT_DEBOUNCE_MS = 2500
const AUDIT_MAX_BATCH = 80

type Options = {
  tableId: string
  tenantId: string
  enableAudit?: boolean
}

export function useDataTablePlatform(opts: Options) {
  const { tableId, tenantId, enableAudit = true } = opts
  const qc = useQueryClient()
  const pendingAudit = useRef<DataTableEvent[]>([])
  const auditTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const viewsQuery = useQuery({
    queryKey: ['data-table-saved-views', tenantId, tableId],
    queryFn: () => listSavedViews(tableId),
    staleTime: 60_000,
    enabled: Boolean(tableId),
  })

  const defaultServerView = useMemo((): DataTableViewConfig | null => {
    const items = viewsQuery.data?.items ?? []
    const row = items.find((x) => x.is_default) ?? items[0]
    if (!row) return null
    return {
      columnVisibility: row.columnVisibility ?? {},
      sorting: row.sorting ?? [],
      columnFilters: row.columnFilters ?? [],
    }
  }, [viewsQuery.data])

  const flushAudit = useCallback(() => {
    if (!enableAudit || pendingAudit.current.length === 0) return
    const batch = pendingAudit.current.splice(0, AUDIT_MAX_BATCH)
    void postAuditEvents(batch).catch(() => {})
  }, [enableAudit])

  const scheduleAuditFlush = useCallback(() => {
    if (!enableAudit) return
    if (auditTimer.current != null) return
    auditTimer.current = setTimeout(() => {
      auditTimer.current = null
      flushAudit()
    }, AUDIT_DEBOUNCE_MS)
  }, [enableAudit, flushAudit])

  const onTableEvent = useCallback(
    (event: DataTableEvent) => {
      if (!enableAudit) return
      pendingAudit.current.push(event)
      scheduleAuditFlush()
    },
    [enableAudit, scheduleAuditFlush],
  )

  useEffect(
    () => () => {
      if (auditTimer.current != null) clearTimeout(auditTimer.current)
      flushAudit()
    },
    [flushAudit],
  )

  const saveView = useCallback(
    async (config: DataTableViewConfig) => {
      const label = `Saved ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
      await createSavedViewApi({ tableId, label, config, makeDefault: false })
      await qc.invalidateQueries({ queryKey: ['data-table-saved-views', tenantId, tableId] })
    },
    [qc, tableId, tenantId],
  )

  const loadViews = useCallback(async () => {
    const { items } = await listSavedViews(tableId)
    return items
  }, [tableId])

  return {
    viewsQuery,
    defaultServerView,
    saveView,
    loadViews,
    onTableEvent,
    invalidateViews: () =>
      qc.invalidateQueries({ queryKey: ['data-table-saved-views', tenantId, tableId] }),
  }
}
