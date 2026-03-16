/**
 * Centralized image resolver for Cloudflare R2 CDN.
 * CDN base: process.env.NEXT_PUBLIC_CDN_URL (e.g. https://cdn.advancedsystems-int.com)
 * R2 structure: cdn/brands/, cdn/products/
 */

function getCdnBase(): string {
  return (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL) || ""
}

const PRODUCT_PLACEHOLDER = "/images/product-placeholder.png"
const BRAND_PLACEHOLDER = "/images/brand-placeholder.png"

/**
 * Resolve product image URL from CDN.
 * Uses CDN/products/{partNumber}/main.png; fallback: product-placeholder.png.
 */
export function resolveProductImage(partNumber?: string): string {
  const CDN = getCdnBase()
  if (partNumber && CDN) {
    const part = partNumber.trim().replace(/\s+/g, "-")
    return `${CDN}/products/${part}/main.png`
  }
  return PRODUCT_PLACEHOLDER
}

/**
 * Resolve brand logo URL.
 * Uses CDN/brands/{normalized}.webp. Fallback: brand-placeholder.png.
 */
export function resolveBrandImage(brand?: string): string {
  const CDN = getCdnBase()
  if (!brand) return BRAND_PLACEHOLDER
  const normalized = brand.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  if (!normalized) return BRAND_PLACEHOLDER
  if (!CDN) return BRAND_PLACEHOLDER
  return `${CDN}/brands/${normalized}.webp`
}

export const PRODUCT_PLACEHOLDER_IMAGE = PRODUCT_PLACEHOLDER
export const BRAND_PLACEHOLDER_IMAGE = BRAND_PLACEHOLDER
