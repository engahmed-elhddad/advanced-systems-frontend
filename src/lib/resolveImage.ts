import { API_BASE_URL } from '@/lib/constants'

const INVALID_URL_TOKENS = new Set(['null', 'undefined', 'none', 'n/a', 'na', '-', '—'])

/**
 * Turn API-relative media paths into absolute URLs. `/uploads/*` lives on the API origin
 * (FastAPI static), not on the Next.js www host — without this, browsers request
 * `https://www…/uploads/…` and get 404.
 */
export function resolvePublicMediaUrl(src: string | null | undefined): string {
  const value = (src ?? '').trim()
  if (!value || INVALID_URL_TOKENS.has(value.toLowerCase())) {
    return '/placeholder.png'
  }
  if (value.startsWith('https://')) {
    return value
  }
  if (value.startsWith('http://')) {
    try {
      const u = new URL(value)
      if (u.hostname.toLowerCase().endsWith('advancedsystems-int.com')) {
        u.protocol = 'https:'
        return u.href
      }
    } catch {
      /* fall through */
    }
    return value
  }
  if (value.startsWith('/uploads/')) {
    const base = API_BASE_URL.replace(/\/$/, '')
    return `${base}${value}`
  }
  if (value.startsWith('uploads/')) {
    const base = API_BASE_URL.replace(/\/$/, '')
    return `${base}/${value}`
  }
  return value
}

/** Normalize product image URLs: empty or junk strings resolve to the site placeholder. */
export function resolveImage(src: string | null | undefined): string {
  const value = (src ?? '').trim()
  if (!value || INVALID_URL_TOKENS.has(value.toLowerCase())) {
    return '/placeholder.png'
  }
  return resolvePublicMediaUrl(value)
}

