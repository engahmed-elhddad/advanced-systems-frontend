'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { API_BASE_URL } from '@/lib/constants'

interface BrandItem {
  name: string
  slug: string
  logo_url?: string | null
}

async function fetchBrands(): Promise<BrandItem[]> {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/brands/`)
  if (!res.ok) return []
  const data = await res.json()
  const brands = Array.isArray(data) ? data : []
  return brands
    .filter((b: Record<string, unknown>) => b.slug && b.name)
    .map((b: Record<string, unknown>) => ({
      name: String(b.name),
      slug: String(b.slug),
      logo_url: b.logo_url ? String(b.logo_url) : null,
    }))
}

export function BrandCarousel() {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBrands()
      .then((list) => {
        if (!cancelled) setBrands(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="w-full overflow-hidden py-12">
        <div className="flex h-12 items-center justify-center">
          <div className="h-8 w-48 animate-pulse rounded-full border border-white/10 bg-white/5" />
        </div>
      </section>
    )
  }

  if (!brands.length) return null

  return (
    <section
      className="group relative w-full overflow-hidden py-12 before:pointer-events-none before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-28 before:bg-gradient-to-r before:from-[#0B1F3A] before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-28 after:bg-gradient-to-l after:from-[#0B1F3A] after:to-transparent after:content-['']"
      aria-label="Brand logos"
    >
      <div className="flex w-max animate-scroll gap-14 group-hover:[animation-play-state:paused]">
        {[...brands, ...brands].map((brand, index) => (
          <Link
            key={`${brand.slug}-${index}`}
            href={`/brands/${encodeURIComponent(brand.slug)}`}
            className="flex w-[150px] flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:scale-[1.05] hover:border-orange-400/30 hover:shadow-[0_0_24px_rgba(255,122,0,0.12)]"
            aria-label={brand.name}
          >
            <BrandLogo
              brand={brand.name}
              variant="default"
              logoSrc={brand.logo_url || `https://cdn.advancedsystems-int.com/cdn/brands/${brand.slug}.webp`}
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
