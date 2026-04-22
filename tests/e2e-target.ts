/**
 * Live E2E target URLs — no localhost / loopback (staging or explicit HTTPS only).
 * Used by global-setup and API helpers in specs.
 */

const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/i

export function parseOrigin(url: string): URL {
  const u = (url || '').trim()
  if (!u) throw new Error('URL is empty')
  return new URL(u.endsWith('/') ? u.slice(0, -1) : u)
}

export function assertNotLoopback(label: string, url: string): void {
  let host: string
  try {
    host = parseOrigin(url).hostname
  } catch {
    throw new Error(`${label}: invalid URL "${url}"`)
  }
  if (LOOPBACK_HOST.test(host)) {
    throw new Error(
      `${label} cannot use localhost/loopback ("${url}"). ` +
        'Set PLAYWRIGHT_BASE_URL (Next site) and E2E_API_BASE_URL or NEXT_PUBLIC_API_URL (FastAPI origin) to staging HTTPS.',
    )
  }
}

/** Browser base URL (Next.js admin UI). Defaults to production staging site. */
export function getBrowserBaseUrl(): string {
  const raw =
    (process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || '').trim() ||
    'https://advancedsystems-int.com'
  assertNotLoopback('PLAYWRIGHT_BASE_URL / E2E_BASE_URL', raw)
  return raw.replace(/\/$/, '')
}

/**
 * FastAPI origin (health + /api/v1/...). Prefer E2E_API_BASE_URL when API is not same host as Next.
 */
export function getApiBaseUrl(): string {
  const candidates = [
    process.env.E2E_API_BASE_URL,
    process.env.PLAYWRIGHT_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean)
  const raw = candidates[0] ?? getBrowserBaseUrl()
  assertNotLoopback('E2E / public API base URL', raw)
  return raw.replace(/\/$/, '')
}

export function getHealthUrl(): string {
  return `${getApiBaseUrl()}/health`
}
