"use client"

import { useState, useEffect } from "react"
import { resolveBrandImage, BRAND_PLACEHOLDER_IMAGE } from "@/lib/imageResolver"

interface BrandLogoProps {
  /** Display name of the brand, e.g. "Siemens", "IFM", "ABB" */
  brand: string
  /** Extra classes for the <img> element */
  logoClassName?: string
  /** Extra classes for the fallback text badge */
  badgeClassName?: string
}

/**
 * Shows the brand's logo from CDN (resolveBrandImage → CDN/brands/{brand}.webp).
 * Falls back to placeholder image or text badge if the image fails to load.
 */
export function BrandLogo({ brand, logoClassName, badgeClassName }: BrandLogoProps) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  useEffect(() => setUsePlaceholder(false), [brand])
  const src = usePlaceholder ? BRAND_PLACEHOLDER_IMAGE : resolveBrandImage(brand)

  if (!brand) {
    return (
      <span
        className={["inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-200 truncate max-w-full", badgeClassName].filter(Boolean).join(" ")}
      >
        —
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={brand}
      loading="lazy"
      onError={() => setUsePlaceholder(true)}
      className={["h-8 max-w-[80px] object-contain mix-blend-multiply dark:mix-blend-normal", logoClassName].filter(Boolean).join(" ")}
    />
  )
}

export default BrandLogo
