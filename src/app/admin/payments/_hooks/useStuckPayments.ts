'use client'

/**
 * Spec 031 T012 — React Query hook for the stuck-payments table on
 * /admin/payments. Reads from backend /api/v1/payments/stuck via admin
 * Bearer token from localStorage, refreshing every 60s.
 *
 * Each row carries `time_stuck_minutes` per spec-030 T017.
 */

import { useQuery } from '@tanstack/react-query'
import { API_BASE_URL } from '@/lib/constants'

export interface StuckAttempt {
  id: number
  order_ref: string
  status: string
  amount_usd: number | null
  amount_egp: number | null
  provider: string
  provider_payment_ref: string | null
  time_stuck_minutes: number | null
  created_at: string | null
  expires_at: string | null
}

export interface StuckEvent {
  id: number
  payment_attempt_id: number | null
  provider: string
  provider_payment_ref: string | null
  event_type: string
  processed_status: string
  provider_status: string | null
  reconciliation_drift: boolean
  raw_payload: Record<string, unknown> | unknown[] | null
  received_at: string | null
}

export interface StuckResponse {
  older_than_minutes: number
  include_expired: boolean
  stuck_attempts: StuckAttempt[]
  failed_callback_events: StuckEvent[]
}

async function fetchStuckPayments(url: string): Promise<StuckResponse> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`stuck fetch failed: HTTP ${res.status}`)
  return res.json() as Promise<StuckResponse>
}

export function useStuckPayments(includeExpired = false, olderThanMinutes = 15) {
  const url = `${API_BASE_URL}/api/v1/payments/stuck?older_than_minutes=${olderThanMinutes}&include_expired=${includeExpired}`
  const query = useQuery<StuckResponse>({
    queryKey: ['payment-stuck', includeExpired, olderThanMinutes],
    queryFn: () => fetchStuckPayments(url),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  return {
    stuckAttempts: query.data?.stuck_attempts,
    failedEvents: query.data?.failed_callback_events,
    raw: query.data,
    error: query.error,
    isLoading: query.isLoading,
    refresh: query.refetch,
  }
}
