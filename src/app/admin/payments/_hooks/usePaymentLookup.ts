'use client'

/**
 * Spec 031 T018 — on-demand lookup hook. No auto-fetch; the caller invokes
 * `lookup({ orderRef, providerRef, attemptId })` which fires a fetch and
 * returns the response.
 */

import { useCallback, useState } from 'react'
import { API_BASE_URL } from '@/lib/constants'

export interface PaymentAttemptDetail {
  id: number
  order_ref: string
  provider: string
  payment_method: string
  status: string
  amount_usd: number | null
  amount_egp: number | null
  currency: string
  provider_payment_ref: string | null
  provider_session_ref: string | null
  rfq_references: string[]
  created_at: string | null
  updated_at: string | null
  expires_at: string | null
}

export interface PaymentEventDetail {
  id: number
  payment_attempt_id: number | null
  provider: string
  event_type: string
  processed_status: string
  received_at: string | null
}

export interface LookupResult {
  attempt: PaymentAttemptDetail
  events: PaymentEventDetail[]
}

export interface LookupArgs {
  orderRef?: string
  providerRef?: string
  attemptId?: number
}

export function usePaymentLookup() {
  const [data, setData] = useState<LookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const lookup = useCallback(async (args: LookupArgs) => {
    const params = new URLSearchParams()
    if (args.orderRef?.trim()) params.set('order_ref', args.orderRef.trim())
    if (args.attemptId != null) params.set('payment_attempt_id', String(args.attemptId))
    if (!params.toString()) {
      setError('Provide order_ref or payment_attempt_id')
      return null
    }
    const url = `${API_BASE_URL}/api/v1/payments/lookup?${params.toString()}`
    setLoading(true)
    setError(null)
    try {
      const token =
        typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(url, { headers })
      if (res.status === 404) {
        setData(null)
        setError('No payment attempt found for the supplied reference')
        return null
      }
      if (!res.ok) throw new Error(`lookup failed: HTTP ${res.status}`)
      const payload = (await res.json()) as LookupResult
      setData(payload)
      return payload
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setData(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { lookup, reset, data, error, isLoading }
}
