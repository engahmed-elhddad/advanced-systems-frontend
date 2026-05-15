import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

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
    response = await fetch(`${API_BASE_URL}/api/v1/internal/search/consistency-check`, {
      method: 'POST',
      headers: {
        Authorization: expectedAuth,
        'Content-Type': 'application/json',
        'User-Agent': 'AdvancedSystems-VercelCron/search-consistency',
      },
      body: JSON.stringify({ batch_size: 500 }),
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
  const payload = (await response.json().catch(async () => ({ error: await response.text().catch(() => '') }))) as {
    db_count?: number
    meili_count?: number
    missing_in_meili_count?: number
    orphaned_in_meili_count?: number
    consistent?: boolean
    error?: string
  }

  if (!response.ok) {
    return NextResponse.json(
      { status: 'failed', backend_status: response.status, ...payload, duration_seconds: durationSeconds },
      { status: 502 },
    )
  }

  return NextResponse.json({
    status: 'success',
    db_count: payload.db_count ?? 0,
    meili_count: payload.meili_count ?? 0,
    missing_in_meili_count: payload.missing_in_meili_count ?? 0,
    orphaned_in_meili_count: payload.orphaned_in_meili_count ?? 0,
    consistent: payload.consistent === true,
    duration_seconds: durationSeconds,
  })
}

export const POST = GET
