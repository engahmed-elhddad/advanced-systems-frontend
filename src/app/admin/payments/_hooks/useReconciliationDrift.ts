'use client'

/**
 * Spec 031 T015 — helper that derives the reconciliation-drift event list
 * from the existing `useStuckPayments()` query, so the drift inbox doesn't
 * need a separate network round-trip.
 *
 * Filtering is client-side because /stuck returns a small bounded list
 * (≤ limit param, default 50). For larger drift volumes, a dedicated backend
 * endpoint should be added — track that as a follow-up.
 */

import type { StuckEvent } from './useStuckPayments'

export interface DriftEvent extends StuckEvent {
  localStatus: string | null
  providerStatus: string | null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  return null
}

function extractLocalStatus(event: StuckEvent): string | null {
  const payload = event.raw_payload
  if (payload && !Array.isArray(payload) && typeof payload === 'object') {
    return asString((payload as Record<string, unknown>).local_status)
  }
  return null
}

export function useReconciliationDrift(events: StuckEvent[] | undefined): {
  driftEvents: DriftEvent[]
  count: number
} {
  if (!events) return { driftEvents: [], count: 0 }
  const drift = events
    .filter((e) => e.reconciliation_drift || e.event_type === 'reconciliation_drift' || e.processed_status === 'reconciliation_drift')
    .map((e) => ({
      ...e,
      localStatus: extractLocalStatus(e),
      providerStatus: e.provider_status,
    }))
  return { driftEvents: drift, count: drift.length }
}
