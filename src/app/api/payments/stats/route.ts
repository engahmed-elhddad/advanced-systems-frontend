/**
 * Spec 031 T009 — server-side proxy for the /payments/stats endpoint.
 *
 * The browser hook (`usePaymentStats`) sends `Authorization: Bearer ${adminToken}`
 * from localStorage; this route forwards that header to the backend at
 * ${API_BASE_URL}/api/v1/payments/stats. The proxy exists primarily so the
 * frontend bundle doesn't hardcode the backend host name and so future caching
 * / rate-limiting can be added at this seam.
 *
 * No CRON_SECRET handling here — that lives in `/api/payments/trigger`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ error: 'missing_admin_bearer' }, { status: 401 })
  }

  const url = new URL(request.url)
  const windowHours = url.searchParams.get('window_hours') ?? '24'

  let backendResponse: Response
  try {
    backendResponse = await fetch(
      `${API_BASE_URL}/api/v1/payments/stats?window_hours=${encodeURIComponent(windowHours)}`,
      {
        headers: { Authorization: authorization },
        cache: 'no-store',
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'upstream_unreachable', detail: message }, { status: 502 })
  }

  const body = await backendResponse.text()
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: { 'Content-Type': backendResponse.headers.get('Content-Type') ?? 'application/json' },
  })
}
