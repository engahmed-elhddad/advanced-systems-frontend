'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  detail?: string
}

export function ErrorBanner({ message, onRetry, detail }: ErrorBannerProps) {
  const [open, setOpen] = useState(false)
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-foreground)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[var(--color-destructive)]">{message}</p>
        {onRetry ? (
          <button
            type="button"
            className="rounded-md border border-[var(--color-destructive)]/50 px-3 py-1 text-xs font-semibold text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
      {detail ? (
        <div className="mt-2">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
            Technical detail
          </button>
          {open ? (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-[var(--color-background-tertiary)] p-2 text-xs text-[var(--color-foreground-muted)]">
              {detail}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
