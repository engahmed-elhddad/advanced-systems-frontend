'use client'

/**
 * Spec 031 T016 — list of payment_events flagged as reconciliation drift.
 *
 * A drift row means: local DB says the attempt is `paid`, but Paymob's
 * transaction API disagreed during the daily reconciliation cron.
 * Operator action: investigate the attempt, decide whether to manually
 * roll it back or contact the provider.
 *
 * Reads drift events from `useReconciliationDrift()` which derives them from
 * the same `useStuckPayments()` response — no extra network call.
 */

import type { DriftEvent } from '../_hooks/useReconciliationDrift'

interface ReconciliationDriftTableProps {
  events: DriftEvent[]
  isLoading: boolean
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function ReconciliationDriftTable({ events, isLoading }: ReconciliationDriftTableProps) {
  return (
    <section aria-labelledby="drift-title" className="space-y-3">
      <header>
        <h2 id="drift-title" className="text-sm font-semibold uppercase tracking-wide text-[--text-secondary]">
          Reconciliation drift inbox
        </h2>
      </header>

      {isLoading && events.length === 0 ? (
        <div className="h-12 animate-pulse rounded border border-[--border] bg-[--bg-elevated] opacity-60" />
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-6 text-center text-sm text-emerald-100">
          ✓ No drift detected.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[--border]">
          <table className="min-w-full divide-y divide-[--border] text-sm">
            <thead className="bg-[--bg-elevated] text-left text-xs uppercase tracking-wide text-[--text-secondary]">
              <tr>
                <th scope="col" className="px-3 py-2">Provider ref</th>
                <th scope="col" className="px-3 py-2">Local</th>
                <th scope="col" className="px-3 py-2">Provider</th>
                <th scope="col" className="px-3 py-2">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {events.map((e) => (
                <tr key={e.id} data-testid={`drift-row-${e.id}`}>
                  <td className="px-3 py-2 font-mono text-xs">{e.provider_payment_ref ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/30">
                      {e.localStatus ?? 'paid'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-200 ring-1 ring-red-400/30">
                      {e.providerStatus ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums text-[--text-secondary]">
                    {formatTimestamp(e.received_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
