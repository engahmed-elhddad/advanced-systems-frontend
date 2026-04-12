import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

const BACKEND = (process.env.INTERNAL_API_URL || API_BASE_URL).replace(/\/$/, '')

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }
  const xf = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  const ua = req.headers.get('user-agent')
  const fwd: Record<string, string> = { 'Content-Type': 'application/json' }
  if (xf) fwd['x-forwarded-for'] = xf
  if (ua) fwd['user-agent'] = ua

  const res = await fetch(`${BACKEND}/api/v1/rfq/`, {
    method: 'POST',
    headers: fwd,
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
