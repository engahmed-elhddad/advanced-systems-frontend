import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'

export async function requireBackendAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authorization = request.headers.get('authorization')
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ error: 'missing_admin_bearer' }, { status: 401 })
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'admin_auth_unreachable', detail: message }, { status: 502 })
  }

  if (response.ok) return null
  if (response.status === 401 || response.status === 403) {
    return NextResponse.json({ error: 'invalid_admin_bearer' }, { status: 401 })
  }
  return NextResponse.json(
    { error: 'admin_auth_failed', backend_status: response.status },
    { status: 502 },
  )
}
