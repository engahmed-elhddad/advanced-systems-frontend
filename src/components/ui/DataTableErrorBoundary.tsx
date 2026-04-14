'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import {
  classifyTableError,
  type DataTableErrorKind,
} from '@/lib/dataTable/classifyTableError'

export type DataTableErrorReportPayload = {
  error: Error
  kind: DataTableErrorKind
  errorInfo: ErrorInfo
  tableId?: string
  /** Redacted / bounded snapshot for support (no full row payloads by default). */
  dataSnapshot?: unknown
  configSnapshot?: unknown
}

type Props = {
  children: ReactNode
  fallbackTitle?: string
  tableId?: string
  onRetry?: () => void
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onErrorReport?: (payload: DataTableErrorReportPayload) => void
  /** Merged into `onErrorReport` when reporting (safe slices from parent). */
  getErrorReportExtras?: () => { dataSnapshot?: unknown; configSnapshot?: unknown }
  maxRetries?: number
}

type State = {
  error: Error | null
  retryAttempts: number
  kind: DataTableErrorKind | null
  errorInfo: ErrorInfo | null
}

const PROD_FALLBACK_DETAIL =
  'Something went wrong while displaying this table. You can try again, or refresh the page.'

function kindTitle(kind: DataTableErrorKind | null): string {
  if (kind === 'config') return 'Configuration issue'
  if (kind === 'data') return 'Data issue'
  return 'Unexpected error'
}

function kindHint(kind: DataTableErrorKind | null, dev: boolean): string {
  if (!dev) return PROD_FALLBACK_DETAIL
  if (kind === 'config') return 'Check required props for server mode, getRowId, and manual* handlers.'
  if (kind === 'data') return 'Check row ids, duplicates, and row shape versus column accessors.'
  return 'See console for the component stack.'
}

/**
 * Catches render errors inside the table subtree and shows a recoverable fallback instead of a blank screen.
 */
export class DataTableErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryAttempts: 0, kind: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, kind: classifyTableError(error), errorInfo: null }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const kind = classifyTableError(error)
    this.setState({ errorInfo: info })
    try {
      this.props.onError?.(error, info)
    } catch {
      /* never let callback break the boundary */
    }
    try {
      const extras = this.props.getErrorReportExtras?.() ?? {}
      this.props.onErrorReport?.({
        error,
        kind,
        errorInfo: info,
        tableId: this.props.tableId,
        dataSnapshot: extras.dataSnapshot,
        configSnapshot: extras.configSnapshot,
      })
    } catch {
      /* same */
    }
    const label = this.props.tableId ? `[DataTableErrorBoundary:${this.props.tableId}]` : '[DataTableErrorBoundary]'
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- surface boundary catches in dev
      console.error(label, { kind, message: error.message }, info.componentStack)
    } else {
      // eslint-disable-next-line no-console -- production observability without leaking stack to UI
      console.error(label, error.name, kind)
    }
  }

  handleRetry = () => {
    const max = this.props.maxRetries ?? 5
    if (this.state.retryAttempts >= max) return
    this.setState((s) => ({
      error: null,
      kind: null,
      errorInfo: null,
      retryAttempts: s.retryAttempts + 1,
    }))
    this.props.onRetry?.()
  }

  handleReport = () => {
    const { error, kind, errorInfo } = this.state
    if (!error || !kind) return
    try {
      const extras = this.props.getErrorReportExtras?.() ?? {}
      this.props.onErrorReport?.({
        error,
        kind,
        errorInfo: errorInfo ?? { componentStack: '' },
        tableId: this.props.tableId,
        dataSnapshot: extras.dataSnapshot,
        configSnapshot: extras.configSnapshot,
      })
    } catch {
      /* ignore */
    }
  }

  render() {
    if (this.state.error) {
      const max = this.props.maxRetries ?? 5
      const atLimit = this.state.retryAttempts >= max
      const dev = process.env.NODE_ENV === 'development'
      const detail = dev
        ? this.state.error.message || 'An unexpected error occurred.'
        : PROD_FALLBACK_DETAIL
      const k = this.state.kind
      return (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-100"
        >
          <p className="font-semibold">{this.props.fallbackTitle ?? 'Table failed to render'}</p>
          <p className="mt-1 text-xs font-medium text-orange-200/90">{kindTitle(k)}</p>
          <p className="mt-1 text-xs text-red-200/90">{detail}</p>
          <p className="mt-2 text-[11px] text-red-200/60">{kindHint(k, dev)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!atLimit ? (
              <Button type="button" size="sm" variant="secondary" onClick={this.handleRetry}>
                Retry
              </Button>
            ) : null}
            {this.props.onErrorReport ? (
              <Button type="button" size="sm" variant="secondary" onClick={this.handleReport}>
                Report issue
              </Button>
            ) : null}
          </div>
          {atLimit ? (
            <p className="mt-3 text-xs text-red-200/70">
              Maximum retries reached. Refresh the page if the problem continues.
            </p>
          ) : null}
        </div>
      )
    }
    return this.props.children
  }
}
