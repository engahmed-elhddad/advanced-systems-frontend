'use client'

/**
 * Spec 031 T019 — search a single PaymentAttempt by order_ref or attempt id.
 *
 * Uses `usePaymentLookup()` (on-demand, no auto-polling). The full result
 * shape from /api/v1/payments/lookup is `{ attempt, events }` so the panel
 * renders an attempt header + event timeline below.
 */

import { useState } from 'react'
import { usePaymentLookup, type PaymentEventDetail } from '../_hooks/usePaymentLookup'

function formatTimestamp(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function formatUsd(amount: number | null): string {
  return amount == null ? '—' : `$${amount.toFixed(2)}`
}

function EventRow({ event }: { event: PaymentEventDetail }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded border border-[--border] bg-[--bg-elevated] px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[--text-secondary]">#{event.id}</span>
        <span className="font-medium">{event.event_type}</span>
        <span className="rounded bg-slate-500/15 px-1.5 py-0.5 text-[10px] ring-1 ring-slate-400/20">
          {event.processed_status}
        </span>
      </div>
      <span className="tabular-nums text-[--text-secondary]">{formatTimestamp(event.received_at)}</span>
    </li>
  )
}

export function PaymentLookupPanel() {
  const { lookup, data, error, isLoading, reset } = usePaymentLookup()
  const [orderRef, setOrderRef] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = orderRef.trim()
    if (!value) return
    await lookup({ orderRef: value })
  }

  return (
    <section aria-labelledby="lookup-title" className="space-y-3">
      <header>
        <h2 id="lookup-title" className="text-sm font-semibold uppercase tracking-wide text-[--text-secondary]">
          Payment lookup
        </h2>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="lookup-order-ref" className="sr-only">Order reference</label>
        <input
          id="lookup-order-ref"
          type="text"
          value={orderRef}
          onChange={(e) => setOrderRef(e.target.value)}
          placeholder="ORD-… or attempt id"
          className="flex-1 rounded border border-[--border] bg-[--bg-elevated] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[--accent]"
        />
        <button
          type="submit"
          disabled={isLoading || orderRef.trim().length === 0}
          className="rounded border border-[--accent] bg-[--accent]/10 px-4 py-2 text-sm font-medium text-[--accent] transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Searching…' : 'Search'}
        </button>
        {(data || error) && (
          <button
            type="button"
            onClick={() => {
              setOrderRef('')
              reset()
            }}
            className="rounded border border-[--border] px-4 py-2 text-sm text-[--text-secondary]"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-3 rounded-lg border border-[--border] p-4">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-mono text-sm">{data.attempt.order_ref}</div>
            <div className="text-xs text-[--text-secondary]">attempt #{data.attempt.id}</div>
          </header>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[--text-secondary]">Status</dt>
              <dd className="font-medium">{data.attempt.status}</dd>
            </div>
            <div>
              <dt className="text-[--text-secondary]">Provider</dt>
              <dd>{data.attempt.provider}</dd>
            </div>
            <div>
              <dt className="text-[--text-secondary]">Amount</dt>
              <dd className="tabular-nums">{formatUsd(data.attempt.amount_usd)}</dd>
            </div>
            <div>
              <dt className="text-[--text-secondary]">Method</dt>
              <dd>{data.attempt.payment_method}</dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-[--text-secondary]">Provider payment ref</dt>
              <dd className="font-mono">{data.attempt.provider_payment_ref ?? '—'}</dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
              Event timeline ({data.events.length})
            </h3>
            {data.events.length === 0 ? (
              <p className="text-xs text-[--text-secondary]">No events recorded for this attempt.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
