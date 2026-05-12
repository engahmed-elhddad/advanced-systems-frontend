import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

/**
 * Spec 030 T027 — Vercel cron: daily at 02:00 UTC, ask the backend to
 * reconcile every locally-paid PaymentAttempt in the lookback window against
 * Paymob's transaction API; any drift is recorded as a PaymentEvent with
 * reconciliation_drift=true.
 *
 * Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` when the
 * cron fires. We forward that header to the backend, where
 * `_require_cron_bearer` validates against the matching Railway env var.
 */

function getAuthSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || process.env.E2E_CRON_SECRET?.trim() || null
}

export async function GET(request: NextRequest) {
  const secret = getAuthSecret()
  const incomingAuth = request.headers.get('authorization')?.trim() || ''
  const expectedAuth = secret ? `Bearer ${secret}` : ''
  if (!secret || incomingAuth !== expectedAuth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/internal/payments/reconcile`, {
      method: 'POST',
      headers: {
        Authorization: expectedAuth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { status: 'failed', error: message, duration_seconds: Number(((Date.now() - started) / 1000).toFixed(3)) },
      { status: 502 },
    )
  }

  const durationSeconds = Number(((Date.now() - started) / 1000).toFixed(3))
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return NextResponse.json(
      { status: 'failed', backend_status: response.status, error: text.slice(0, 500), duration_seconds: durationSeconds },
      { status: 502 },
    )
  }

  const payload = (await response.json().catch(() => ({}))) as {
    checked?: number
    drift_detected?: number
    drift_ids?: number[]
  }
  return NextResponse.json({
    status: 'success',
    checked: payload.checked ?? 0,
    drift_detected: payload.drift_detected ?? 0,
    drift_ids: payload.drift_ids ?? [],
    duration_seconds: durationSeconds,
  })
}

export const POST = GET
