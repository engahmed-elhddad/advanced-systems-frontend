import type { User } from '@/types/user'
import { useAuthStore } from '@/state/useAuthStore'
import { ApiError, type ApiResult } from '@/types/api'
import { apiClient } from './client'

export interface LoginResponse {
  access_token: string
  token_type: string
  user: { email: string; name?: string | null }
}

function mapLoginUser(raw: { email: string; name?: string | null }): User {
  return {
    id: raw.email,
    email: raw.email,
    name: raw.name ?? undefined,
    role: 'admin',
  }
}

/** Decode JWT payload (no signature verification — display / client hydration only). */
function decodeJwtEmail(token: string): string | null {
  try {
    const parts = token.split('.')
    const payload = parts[1]
    if (!payload) return null
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    ) as { sub?: string }
    return typeof json.sub === 'string' ? json.sub : null
  } catch {
    return null
  }
}

export async function login(
  email: string,
  password: string
): ApiResult<{ access_token: string; user: User }> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)
  const data = await apiClient.post<LoginResponse>('/api/v1/admin/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return { access_token: data.access_token, user: mapLoginUser(data.user) }
}

/**
 * Hydrates the current user from the persisted JWT (`sub` claim).
 * The backend does not expose a dedicated `/me` route; admin identity is embedded in the token.
 */
export async function getMe(): ApiResult<User> {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new ApiError(401, 'unauthorized', 'Not authenticated')
  }
  const email = decodeJwtEmail(token)
  if (!email) {
    throw new ApiError(401, 'invalid_token', 'Invalid token')
  }
  return { id: email, email, role: 'admin' }
}

export async function logout(): ApiResult<void> {
  return
}
