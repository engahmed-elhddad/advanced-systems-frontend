'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { API_BASE_URL } from '@/lib/constants'
import { BRAND_MAP } from '@/lib/brands'

interface BrandItem {
  name: string
  slug: string
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function brandDisplayName(name: string): string {
  if (!name || !name.trim()) return name
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const fromMap = BRAND_MAP[slug] ?? BRAND_MAP[slug.split('-')[0]]
  if (fromMap) return fromMap
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

async function fetchMergedBrands(): Promise<BrandItem[]> {
  const bySlug = new Map<string, BrandItem>()

  const ingest = (products: Array<Record<string, unknown>>) => {
    for (const p of products) {
      const raw = String(p.brand ?? p.manufacturer ?? '').trim()
      if (!raw) continue
      const slug = slugFromName(raw)
      if (!bySlug.has(slug)) bySlug.set(slug, { name: brandDisplayName(raw), slug })
    }
  }

  let productsRes = await apiFetch(`${API_BASE_URL}/api/v1/products/?page=1&size=100`)
  if (productsRes.ok) {
    const data = await productsRes.json()
    const products = (data.items ?? data.products ?? data.results ?? []) as Array<Record<string, unknown>>
    if (Array.isArray(products)) ingest(products)
  }
  if (bySlug.size < 8) {
    productsRes = await apiFetch(`${API_BASE_URL}/products?limit=500`)
    if (productsRes.ok) {
      const data = await productsRes.json()
      const products = (data.products ?? data.results ?? []) as Array<Record<string, unknown>>
      if (Array.isArray(products)) ingest(products)
    }
  }

  const list = Array.from(bySlug.values())
  list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  return list
}

export function BrandCarousel() {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMergedBrands()
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
              logoSrc={`https://cdn.advancedsystems-int.com/cdn/brands/${brand.slug}.webp`}
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
