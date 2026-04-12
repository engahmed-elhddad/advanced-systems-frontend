/**
 * Admin API key for browser-originated requests — from NEXT_PUBLIC_ADMIN_API_KEY only.
 * Never use a hardcoded fallback (production safety).
 */
export function getBrowserAdminApiKey(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "").trim()
}
