'use client'

/**
 * Spec 031 T008 — React Query hook for the /admin/payments SLO panel.
 * Reads from the server-side proxy at /api/payments/stats every 60s.
 * (Project uses @tanstack/react-query, not SWR — spec.md said "useSWR" but
 * the convention here is React Query.)
 */

import { useQuery } from '@tanstack/react-query'

export interface PaymentStats {
  window_hours: number
  duplicate_count: number
  replay_attack_count: number
  invalid_transition_count: number
  invalid_sig_count: number
  reconciliation_drift_count: number
  stuck_provider_pending_count: number
  expired_count: number
  system_action_count: number
}

async function fetchPaymentStats(windowHours: number): Promise<PaymentStats> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api/payments/stats?window_hours=${windowHours}`, { headers })
  if (!res.ok) throw new Error(`stats fetch failed: HTTP ${res.status}`)
  return res.json() as Promise<PaymentStats>
}

export function usePaymentStats(windowHours = 24) {
  const query = useQuery<PaymentStats>({
    queryKey: ['payment-stats', windowHours],
    queryFn: () => fetchPaymentStats(windowHours),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  return {
    stats: query.data,
    error: query.error,
    isLoading: query.isLoading,
    refresh: query.refetch,
  }
}
