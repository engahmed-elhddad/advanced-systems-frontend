/**
 * Spec 031 T021 — server-side proxy for the cron-protected payment endpoints.
 *
 * The browser POSTs `{ action: "expire" | "reconcile", lookback_hours?: number }`
 * with the admin's Bearer token (from localStorage) in the `Authorization` header.
 * This route validates the admin Bearer token with the backend, then forwards to
 * the backend with `Authorization: Bearer ${process.env.CRON_SECRET}` injected
 * server-side.
 *
 * AC-08: CRON_SECRET MUST never appear in the browser network tab. The browser
 * only ever sees its own admin Bearer token; the CRON_SECRET stays on the
 * Vercel server.
 */

import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'
import { requireBackendAdmin } from '@/lib/serverAdminAuth'

const ACTION_TO_PATH: Record<string, string> = {
  expire: '/api/v1/internal/payments/expire-stale',
  reconcile: '/api/v1/internal/payments/reconcile',
}

interface TriggerBody {
  action?: string
  lookback_hours?: number
}

export async function POST(request: NextRequest) {
  const authFailure = await requireBackendAdmin(request)
  if (authFailure) return authFailure

  const cronSecret = (process.env.CRON_SECRET ?? process.env.E2E_CRON_SECRET ?? '').trim()
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'cron_secret_unconfigured', detail: 'CRON_SECRET is not set on this Vercel deployment' },
      { status: 500 },
    )
  }

  let body: TriggerBody
  try {
    body = (await request.json()) as TriggerBody
  } catch {
    return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action.trim() : ''
  const backendPath = ACTION_TO_PATH[action]
  if (!backendPath) {
    return NextResponse.json(
      { error: 'unknown_action', detail: `action must be one of: ${Object.keys(ACTION_TO_PATH).join(', ')}` },
      { status: 400 },
    )
  }

  const upstreamBody: Record<string, unknown> = {}
  if (action === 'reconcile' && typeof body.lookback_hours === 'number') {
    upstreamBody.lookback_hours = body.lookback_hours
  }

  let upstream: Response
  try {
    upstream = await fetch(`${API_BASE_URL}${backendPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
      cache: 'no-store',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'upstream_unreachable', detail: message }, { status: 502 })
  }

  const responseBody = await upstream.text()
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}
