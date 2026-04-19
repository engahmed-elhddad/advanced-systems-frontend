import { PRODUCT_PLACEHOLDER_IMAGE } from '@/lib/constants'
import { resolveProductImage } from '@/lib/imageResolver'
import { resolveImage } from '@/lib/resolveImage'

/**
 * Storefront catalog images: backend always exposes a single field, ``image_url``.
 * Use {@link getProductImage} when a non-empty URL or placeholder path is required for `<img src>`.
 */
export function primaryProductImageUrl(product: Record<string, unknown> | null | undefined): string {
  if (!product || typeof product !== 'object') return ''
  return String(product.image_url ?? '').trim()
}

/** Always returns a usable `src` string (falls back to site placeholder). */
export function getProductImage(product: any): string {
  const u = primaryProductImageUrl(product)
  if (u) {
    return resolveImage(u)
  }
  const pn =
    product && typeof product.part_number === 'string' ? product.part_number.trim() : ''
  if (pn) {
    const cdnTry = resolveProductImage(pn)
    if (cdnTry && cdnTry !== PRODUCT_PLACEHOLDER_IMAGE) {
      return cdnTry
    }
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    const id = product && typeof product === 'object' ? (product as { id?: unknown }).id : undefined
    if (id != null || pn) {
      // eslint-disable-next-line no-console -- intentional: surface missing API image_url during development
      console.warn('[product] missing image_url', { id, part_number: pn })
    }
  }
  return PRODUCT_PLACEHOLDER_IMAGE
}
