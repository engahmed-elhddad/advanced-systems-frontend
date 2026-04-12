import { API_BASE_URL } from '@/lib/constants'
import { getSessionId, getVisitorId } from '@/lib/visitor-context'

const base = API_BASE_URL.replace(/\/$/, '')

export type ShopUser = {
  id: number
  email: string
  full_name?: string | null
  picture_url?: string | null
  oauth_provider?: string | null
  is_active: boolean
}

export type ShopSessionResponse = { user: ShopUser | null }

export type GoogleAuthResponse = {
  access_token: string
  token_type: string
  user: ShopUser
}

export async function fetchShopSession(): Promise<ShopSessionResponse> {
  const res = await fetch(`${base}/api/v1/auth/shop/session`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Session request failed: ${res.status}`)
  }
  return res.json() as Promise<ShopSessionResponse>
}

/**
 * Exchange a Google ID token for a shop JWT. Sets httpOnly session cookie (same-site).
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<GoogleAuthResponse> {
  const visitorId = getVisitorId()
  const sessionId = getSessionId()
  if (!visitorId || !sessionId) {
    throw new Error('Visitor or session ID missing — enable analytics consent and reload.')
  }
  const res = await fetch(`${base}/api/v1/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      id_token: idToken,
      visitor_id: visitorId,
      session_id: sessionId,
    }),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = (await res.json()) as { detail?: string }
      if (j?.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch {
      /* ignore */
    }
    throw new Error(detail || 'Google sign-in failed')
  }
  return res.json() as Promise<GoogleAuthResponse>
}

export async function signOutShop(): Promise<void> {
  await fetch(`${base}/api/v1/auth/shop/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
