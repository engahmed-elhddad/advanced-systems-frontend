const INVALID_URL_TOKENS = new Set(['null', 'undefined', 'none', 'n/a', 'na', '-', '—'])

/** Normalize product image URLs: empty or junk strings resolve to the site placeholder. */
export function resolveImage(src: string | null | undefined): string {
  const value = (src ?? '').trim()
  if (!value) {
    return '/placeholder.png'
  }
  if (INVALID_URL_TOKENS.has(value.toLowerCase())) {
    return '/placeholder.png'
  }
  return value
}

