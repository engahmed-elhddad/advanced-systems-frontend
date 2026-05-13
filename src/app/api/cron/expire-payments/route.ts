import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

/**
 * Vercel cron safety sweep: ask the backend to reap payment_attempts whose
 * `expires_at` has passed. High-frequency expiry belongs on Railway or a
 * Pro-plan cron; this route is scheduled daily so Hobby deployments do not fail.
 *
 * Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` when the
 * cron fires. We forward that same header to the backend, where
 * `_require_cron_bearer` validates it against the matching Railway env var.
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
    response = await fetch(`${API_BASE_URL}/api/v1/internal/payments/expire-stale`, {
      method: 'POST',
      headers: { Authorization: expectedAuth },
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
    expired_count?: number
    attempt_ids?: number[]
  }
  return NextResponse.json({
    status: 'success',
    expired_count: payload.expired_count ?? 0,
    attempt_ids: payload.attempt_ids ?? [],
    duration_seconds: durationSeconds,
  })
}

export const POST = GET
