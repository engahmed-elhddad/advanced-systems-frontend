'use client'

/**
 * Spec 031 T013 — table of stuck/expired PaymentAttempts.
 *
 * Reads from `useStuckPayments(includeExpired)`. Auto-refreshes every 60s.
 * Empty state when no rows match. Skeleton while loading on first paint.
 */

import { useState } from 'react'
import type { StuckAttempt } from '../_hooks/useStuckPayments'

interface StuckPaymentsTableProps {
  attempts: StuckAttempt[] | undefined
  isLoading: boolean
  error: Error | null | unknown
  includeExpired: boolean
  onToggleIncludeExpired: (next: boolean) => void
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  provider_pending: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  expired: 'bg-red-500/15 text-red-200 ring-red-400/30',
  checkout_created: 'bg-slate-500/15 text-slate-200 ring-slate-400/30',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASS[status] ?? 'bg-slate-500/15 text-slate-200 ring-slate-400/30'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      {status}
    </span>
  )
}

function formatUsd(amount: number | null): string {
  if (amount == null) return '—'
  return `$${amount.toFixed(2)}`
}

function formatMinutes(value: number | null): string {
  if (value == null) return '—'
  if (value >= 60) return `${(value / 60).toFixed(1)}h`
  return `${Math.round(value)}m`
}

export function StuckPaymentsTable({
  attempts,
  isLoading,
  error,
  includeExpired,
  onToggleIncludeExpired,
}: StuckPaymentsTableProps) {
  if (error && !attempts) {
    return (
      <section aria-labelledby="stuck-title" className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
        <h2 id="stuck-title" className="font-semibold">Stuck payments unavailable</h2>
        <p className="mt-1 opacity-80">{error instanceof Error ? error.message : 'Unknown error fetching /api/v1/payments/stuck'}</p>
      </section>
    )
  }

  const showSkeleton = isLoading && !attempts

  return (
    <section aria-labelledby="stuck-title" className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 id="stuck-title" className="text-sm font-semibold uppercase tracking-wide text-[--text-secondary]">
          Stuck payments
        </h2>
        <label className="flex items-center gap-2 text-xs text-[--text-secondary]">
          <input
            type="checkbox"
            className="h-3 w-3"
            checked={includeExpired}
            onChange={(e) => onToggleIncludeExpired(e.target.checked)}
          />
          Include expired
        </label>
      </header>

      {showSkeleton ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-[--border] bg-[--bg-elevated] opacity-60" />
          ))}
        </div>
      ) : !attempts || attempts.length === 0 ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-6 text-center text-sm text-emerald-100">
          ✓ All clear — no stuck payments.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[--border]">
          <table className="min-w-full divide-y divide-[--border] text-sm">
            <thead className="bg-[--bg-elevated] text-left text-xs uppercase tracking-wide text-[--text-secondary]">
              <tr>
                <th scope="col" className="px-3 py-2">Order ref</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Stuck</th>
                <th scope="col" className="px-3 py-2">Amount</th>
                <th scope="col" className="px-3 py-2">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {attempts.map((a) => (
                <tr key={a.id} data-testid={`stuck-row-${a.id}`}>
                  <td className="px-3 py-2 font-mono text-xs">{a.order_ref}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2 tabular-nums">{formatMinutes(a.time_stuck_minutes)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatUsd(a.amount_usd)}</td>
                  <td className="px-3 py-2">{a.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Convenience wrapper that owns the include-expired toggle state — keeps
// page.tsx simple while letting the table be controlled in tests.
export function StuckPaymentsTableContainer(props: {
  attempts: StuckAttempt[] | undefined
  isLoading: boolean
  error: Error | null | unknown
  initialIncludeExpired?: boolean
  onIncludeExpiredChange?: (next: boolean) => void
}) {
  const [includeExpired, setIncludeExpired] = useState(props.initialIncludeExpired ?? false)
  return (
    <StuckPaymentsTable
      attempts={props.attempts}
      isLoading={props.isLoading}
      error={props.error}
      includeExpired={includeExpired}
      onToggleIncludeExpired={(next) => {
        setIncludeExpired(next)
        props.onIncludeExpiredChange?.(next)
      }}
    />
  )
}
