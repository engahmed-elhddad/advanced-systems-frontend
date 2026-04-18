/**
 * Product image resolution: try API-hosted uploads …/uploads/products/{partNumber}.jpg|.png|.webp then placeholder.
 * Paths must be absolute to the API origin — root-relative /uploads/… on the www host 404s.
 */

import { API_BASE_URL } from '@/lib/constants'

function uploadsProductsBase(): string {
  return `${API_BASE_URL.replace(/\/$/, '')}/uploads/products`
}

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
  const base = uploadsProductsBase()
  return [`${base}/${part}.jpg`, `${base}/${part}.png`, `${base}/${part}.webp`]
}

/** First candidate URL (e.g. for server/buildImageSrc). */
export function getProductImage(partNumber: string | undefined): string {
  const candidates = getProductImageCandidates(partNumber)
  return candidates[0] ?? PLACEHOLDER
}

export const PRODUCT_PLACEHOLDER = PLACEHOLDER
