/**
 * Admin authentication helpers (client-side).
 * Uses JWT in localStorage or api-key from env for API calls.
 */

const ADMIN_TOKEN_KEY = "admin_token"
const ADMIN_USER_KEY = "admin_user"

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY
  return !!(token || apiKey)
}

export function clearAdminAuth(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function getAdminUser(): { email: string; role: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { email: string; role: string }
  } catch {
    return null
  }
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY
  if (apiKey) headers["api-key"] = apiKey
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (token) headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}
