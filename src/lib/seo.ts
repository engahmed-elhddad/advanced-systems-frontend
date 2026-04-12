import { SITE_URL } from '@/lib/constants'

/** Absolute canonical URL for metadata `alternates.canonical`. */
export function canonicalPath(path: string): string {
  const base = SITE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
