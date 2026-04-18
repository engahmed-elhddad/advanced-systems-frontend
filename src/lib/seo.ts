import { API_BASE_URL, SITE_URL } from '@/lib/constants'

/** Absolute canonical URL for metadata `alternates.canonical`. */
export function canonicalPath(path: string): string {
  const base = SITE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Turn a path or already-absolute URL into an absolute `https://…` string (for JSON-LD `image`, etc.). */
export function absoluteUrl(pathOrUrl: string): string {
  const raw = (pathOrUrl ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  const path = raw.startsWith('/') ? raw : `/${raw}`
  if (path.startsWith('/uploads/')) {
    const base = API_BASE_URL.replace(/\/$/, '')
    return `${base}${path}`
  }
  return canonicalPath(path)
}

/** Meta description fallback: trim, collapse whitespace, max `maxLen` chars (no mid-word cut when possible). */
export function truncateMetaDescription(text: string, maxLen = 155): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= maxLen) return t
  const slice = t.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > 40 ? slice.slice(0, lastSpace) : slice.trimEnd()
  return `${cut.trimEnd()}…`
}
