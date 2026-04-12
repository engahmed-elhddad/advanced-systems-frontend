/**
 * Product image resolution: try /uploads/products/{partNumber}.jpg, .png, .webp then placeholder.
 * Use with ProductImage component for client-side fallback on error.
 */

const UPLOADS_BASE = '/uploads/products'
const PLACEHOLDER = '/images/product-placeholder.png'

/** Sanitize part number for file path (no slashes, trim). */
function safePartNumber(partNumber: string | undefined): string {
  if (!partNumber || typeof partNumber !== 'string') return ''
  return partNumber.trim().replace(/\s+/g, '-').replace(/[/\\]/g, '')
}

/**
 * Return candidate URLs to try in order: .jpg, .png, .webp.
 * Component should try each and on error use next, then placeholder.
 */
export function getProductImageCandidates(partNumber: string | undefined): string[] {
  const part = safePartNumber(partNumber)
  if (!part) return []
  return [
    `${UPLOADS_BASE}/${part}.jpg`,
    `${UPLOADS_BASE}/${part}.png`,
    `${UPLOADS_BASE}/${part}.webp`,
  ]
}

/** First candidate URL (e.g. for server/buildImageSrc). */
export function getProductImage(partNumber: string | undefined): string {
  const candidates = getProductImageCandidates(partNumber)
  return candidates[0] ?? PLACEHOLDER
}

export const PRODUCT_PLACEHOLDER = PLACEHOLDER
