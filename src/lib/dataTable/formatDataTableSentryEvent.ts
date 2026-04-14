import type { DataTableErrorKind } from '@/lib/dataTable/classifyTableError'
import type { ErrorInfo } from 'react'

export type SentryLikeTablePayload = {
  message: string
  level: 'error'
  tags: Record<string, string>
  extra: Record<string, unknown>
  fingerprint: string[]
}

/**
 * Shape suitable for Sentry.captureException / captureMessage enrichment.
 */
export function formatDataTableSentryEvent(input: {
  error: Error
  kind: DataTableErrorKind
  errorInfo: ErrorInfo
  tableId?: string
  dataSnapshot?: unknown
  configSnapshot?: unknown
}): SentryLikeTablePayload {
  return {
    message: `[DataTable${input.tableId ? `:${input.tableId}` : ''}] ${input.error.message}`,
    level: 'error',
    tags: {
      'data_table.kind': input.kind,
      ...(input.tableId ? { table_id: input.tableId } : {}),
    },
    extra: {
      name: input.error.name,
      componentStack: input.errorInfo.componentStack,
      dataSnapshot: input.dataSnapshot,
      configSnapshot: input.configSnapshot,
    },
    fingerprint: ['data-table', input.kind, input.tableId ?? 'unknown'],
  }
}
