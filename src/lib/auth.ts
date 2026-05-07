import { API_BASE_URL } from '@/lib/constants'

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

export async function signOutShop(): Promise<void> {
  await fetch(`${base}/api/v1/auth/shop/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
