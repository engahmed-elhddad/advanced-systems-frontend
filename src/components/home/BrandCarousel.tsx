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
          <div className="h-8 w-48 animate-pulse rounded-full border border-[--border] bg-[--bg-elevated]" />
        </div>
      </section>
    )
  }

  if (!brands.length) return null

  return (
    <section className="group relative w-full overflow-hidden py-12" aria-label="Brand logos">
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28"
        style={{ background: 'linear-gradient(to right, #0E1116, transparent)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28"
        style={{ background: 'linear-gradient(to left, #0E1116, transparent)' }}
        aria-hidden
      />
      <div className="flex w-max animate-scroll gap-14 group-hover:[animation-play-state:paused]">
        {[...brands, ...brands].map((brand, index) => (
          <Link
            key={`${brand.slug}-${index}`}
            href={`/brands/${encodeURIComponent(brand.slug)}`}
            className="flex w-[150px] flex-shrink-0 items-center justify-center rounded-xl border border-[--border] bg-[--bg-elevated] px-4 py-3 transition-colors hover:border-[--accent]"
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
