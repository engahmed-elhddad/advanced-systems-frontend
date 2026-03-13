"use client"

import { useState, useEffect } from "react"
import { BRAND_SLUG_MAP } from "@/app/lib/constants"

interface BrandLogoProps {
  /** Display name of the brand, e.g. "Siemens", "IFM", "ABB" */
  brand: string
  /** Extra classes for the <img> element */
  logoClassName?: string
  /** Extra classes for the fallback text badge */
  badgeClassName?: string
}

/** Build a case-insensitive lookup map once at module load */
const BRAND_SLUG_MAP_CI: Record<string, string> = Object.fromEntries(
  Object.entries(BRAND_SLUG_MAP).map(([name, slug]) => [name.toLowerCase(), slug])
)

/**
 * Resolve a URL-safe slug for the given brand name.
 * Priority: explicit mapping → auto-generated slug from name.
 * Auto-generation: lowercase, spaces → hyphens, strip non-alphanumeric chars.
 * e.g. "Siemens" → "siemens", "Phoenix Contact" → "phoenix-contact"
 */
function getSlug(brand: string): string {
  if (!brand) return ""
  return (
    BRAND_SLUG_MAP[brand] ??
    BRAND_SLUG_MAP_CI[brand.toLowerCase()] ??
    brand.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  )
}

/**
 * Shows the brand's logo from /public/brands/{slug}.png.
 * Falls back to a styled text badge if the image fails to load.
 */
export function BrandLogo({ brand, logoClassName, badgeClassName }: BrandLogoProps) {
  const slug = getSlug(brand)
  const [src, setSrc] = useState<string | null>(slug ? `/brands/${slug}.png` : null)
  const [triedSvg, setTriedSvg] = useState(false)

  // Reset state when the brand prop changes
  useEffect(() => {
    setSrc(slug ? `/brands/${slug}.png` : null)
    setTriedSvg(false)
  }, [brand])

  if (!slug || src === null) {
    return (
      <span
        className={["inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-200 truncate max-w-full", badgeClassName].filter(Boolean).join(" ")}
      >
        {brand}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={brand}
      onError={() => {
        if (!triedSvg) {
          // PNG not found – try SVG
          setTriedSvg(true)
          setSrc(`/brands/${slug}.svg`)
        } else {
          // SVG also not found – show text badge
          setSrc(null)
        }
      }}
      className={["h-8 max-w-[80px] object-contain mix-blend-multiply dark:mix-blend-normal", logoClassName].filter(Boolean).join(" ")}
    />
  )
}

export default BrandLogo
