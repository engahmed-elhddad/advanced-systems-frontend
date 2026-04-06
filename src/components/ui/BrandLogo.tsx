"use client"

interface BrandLogoProps {
  brand: string
  variant?: "default" | "circle" | "square"
  logoSrc?: string | null
  logoClassName?: string
  badgeClassName?: string
}

export function BrandLogo({ brand, logoSrc, logoClassName, badgeClassName }: BrandLogoProps) {
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
    logoSrc
      ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={brand}
          loading="lazy"
          className={["h-8 max-w-[80px] object-contain mix-blend-multiply dark:mix-blend-normal", logoClassName].filter(Boolean).join(" ")}
        />
      )
      : (
        <span
          className={["inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-200 truncate max-w-full", badgeClassName].filter(Boolean).join(" ")}
        >
          {brand}
        </span>
      )
  )
}

export default BrandLogo
