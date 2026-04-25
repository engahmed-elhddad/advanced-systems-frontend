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
      <section className="w-full px-6 py-8">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      </section>
    )
  }

  if (!brands.length) return null

  return (
    <section className="w-full px-6 py-8" aria-label="Brand logos">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brands/${encodeURIComponent(brand.slug)}`}
            className="flex h-20 items-center justify-center rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-[--accent]"
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
