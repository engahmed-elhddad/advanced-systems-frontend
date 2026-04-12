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
 * Uses CDN/cdn/products/{partNumber}/main.png; fallback: product-placeholder.png.
 */
export function resolveProductImage(partNumber?: string): string {
  const CDN = getCdnBase()
  if (partNumber && CDN) {
    const part = partNumber.trim().replace(/\s+/g, "-")
    return `${CDN}/cdn/products/${part}/main.png`
  }
  return PRODUCT_PLACEHOLDER
}

/** Normalize brand name for CDN path: lowercase, spaces → "-". */
export function normalizeBrandForPath(brand: string): string {
  return brand.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export type BrandLogoVariant = "default" | "circle" | "square"

/**
 * Resolve brand logo URL from CDN.
 * Variants: default → .webp (main rectangular), circle → _circle.png, square → _square.png.
 * Path: CDN/cdn/brands/{normalized}.webp | _circle.png | _square.png
 */
export function resolveBrandImage(brand?: string, variant: BrandLogoVariant = "default"): string {
  const CDN = getCdnBase()
  if (!brand) return BRAND_PLACEHOLDER
  const normalized = normalizeBrandForPath(brand)
  if (!normalized) return BRAND_PLACEHOLDER
  if (!CDN) return BRAND_PLACEHOLDER
  if (variant === "circle") return `${CDN}/cdn/brands/${normalized}_circle.png`
  if (variant === "square") return `${CDN}/cdn/brands/${normalized}_square.png`
  return `${CDN}/cdn/brands/${normalized}.webp`
}

export const PRODUCT_PLACEHOLDER_IMAGE = PRODUCT_PLACEHOLDER
export const BRAND_PLACEHOLDER_IMAGE = BRAND_PLACEHOLDER
