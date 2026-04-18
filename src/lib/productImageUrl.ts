/**
 * Storefront catalog images: backend always exposes a single field, ``image_url``.
 * Use {@link getProductImage} when a non-empty URL or placeholder path is required for `<img src>`.
 */
export function primaryProductImageUrl(product: Record<string, unknown> | null | undefined): string {
  if (!product || typeof product !== 'object') return ''
  return String(product.image_url ?? '').trim()
}

/** Always returns a usable `src` string (falls back to site placeholder). */
export function getProductImage(product: Record<string, unknown> | null | undefined): string {
  const u = primaryProductImageUrl(product)
  if (!u && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    const id = product && typeof product === 'object' ? (product as { id?: unknown }).id : undefined
    const pn = product && typeof product === 'object' ? (product as { part_number?: unknown }).part_number : undefined
    if (id != null || (typeof pn === 'string' && pn.trim())) {
      // eslint-disable-next-line no-console -- intentional: surface missing API image_url during development
      console.warn('[product] missing image_url', { id, part_number: pn })
    }
  }
  return u || '/placeholder.png'
}
