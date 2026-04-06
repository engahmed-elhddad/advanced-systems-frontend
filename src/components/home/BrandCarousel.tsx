'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '@/app/lib/constants'
import { BRAND_MAP } from '@/app/lib/brands'

interface BrandItem { name: string; slug: string }

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

function filenameToBrandName(filename: string): string {
  const base = filename.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '').trim()
  if (!base) return filename
  const withSpaces = base.replace(/-/g, ' ')
  if (base.length <= 4 && /^[a-z0-9]+$/i.test(base)) return base.toUpperCase()
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function fetchMergedBrands(): Promise<BrandItem[]> {
  const productsRes = await apiFetch(`${API_BASE_URL}/products?limit=500`)

  const bySlug = new Map<string, BrandItem>()

  if (productsRes.ok) {
    const data = await productsRes.json()
    const products = data.products ?? data.results ?? []
    for (const p of products) {
      const raw = (p.brand ?? p.manufacturer ?? '').trim()
      if (!raw) continue
      const slug = slugFromName(raw)
      if (!bySlug.has(slug)) bySlug.set(slug, { name: brandDisplayName(raw), slug })
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
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="overflow-hidden w-full py-8 bg-white">
        <div className="h-10 md:h-12 flex items-center justify-center">
          <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
        </div>
      </section>
    )
  }

  if (!brands.length) return null

  return (
    <section
      className="group relative w-full overflow-hidden py-8 bg-white before:pointer-events-none before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-24 before:bg-gradient-to-r before:from-white before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-24 after:bg-gradient-to-l after:from-white after:to-transparent after:content-['']"
      aria-label="Brand logos"
    >
      <div className="flex w-max gap-12 animate-scroll group-hover:[animation-play-state:paused]">
        {[...brands, ...brands].map((brand, index) => (
          <Link
            key={`${brand.slug}-${index}`}
            href={`/brand/${encodeURIComponent(brand.slug)}`}
            className="flex w-[140px] flex-shrink-0 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
            aria-label={brand.name}
          >
            <span className="text-sm font-semibold text-gray-700 md:text-base">{brand.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
