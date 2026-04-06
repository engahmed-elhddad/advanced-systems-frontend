'use client'

import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { dismiss, type ToastItem } from '@/lib/toast'
import { useUIStore } from '@/state/useUIStore'

function ToastCard({ item }: { item: ToastItem }) {
  const assertive = item.kind === 'error'
  return (
    <button
      type="button"
      role="alert"
      aria-live={assertive ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto mb-2 flex w-80 max-w-[calc(100vw-2rem)] cursor-pointer flex-col overflow-hidden rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background-secondary)] text-left shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
        item.kind === 'error' && 'border-[var(--color-destructive)]/50',
        item.kind === 'success' && 'border-[var(--color-success)]/40',
        item.kind === 'warning' && 'border-[var(--color-warning)]/40'
      )}
      onClick={() => dismiss(item.id)}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <p className="flex-1 text-sm text-[var(--color-foreground)]">{item.message}</p>
        {item.action ? (
          <button
            type="button"
            className="rounded border border-[var(--color-border)] px-2 py-0.5 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              item.action?.onClick()
            }}
          >
            {item.action.label}
          </button>
        ) : null}
        <button
          type="button"
          className="rounded px-1 text-xs text-[var(--color-foreground-muted)]"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation()
            dismiss(item.id)
          }}
        >
          ×
        </button>
      </div>
      <div className="h-1 w-full bg-[var(--color-background-tertiary)]">
        <div
          className="toast-progress-bar h-full bg-[var(--color-primary)]"
          style={{ animationDuration: `${item.duration}ms` }}
        />
      </div>
    </button>
  )
}

export function ToastViewport() {
  const items = useUIStore((s) => s.toasts)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[50] flex flex-col items-end"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>,
    document.body
  )
}
