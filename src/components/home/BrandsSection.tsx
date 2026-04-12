'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/lib/constants'
import { BRAND_MAP } from '@/lib/brands'

interface BrandItem {
  name: string
  slug: string
  /** When set, use this URL for the logo (e.g. /brands/siemens.png). */
  logoUrl?: string | null
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Display name: use BRAND_MAP for known brands (IFM, ABB, etc.), else title case. */
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

/** Convert logo filename to brand name: siemens.png → Siemens, abb.png → ABB */
function filenameToBrandName(filename: string): string {
  const base = filename.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '').trim()
  if (!base) return filename
  const withSpaces = base.replace(/-/g, ' ')
  if (base.length <= 4 && /^[a-z0-9]+$/i.test(base)) return base.toUpperCase()
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Merge brands from products API and from public/brands logos; dedupe by slug, sort by name. */
async function fetchMergedBrands(): Promise<BrandItem[]> {
  const [productsRes, logosRes] = await Promise.all([
    apiFetch(`${API_BASE_URL}/api/v1/products/?page=1&size=100`),
    apiFetch('/api/brands/logos'),
  ])

  const bySlug = new Map<string, BrandItem>()

  const ingestProducts = (products: Array<{ brand?: string; manufacturer?: string }>) => {
    for (const p of products) {
      const raw = (p.brand ?? p.manufacturer ?? '').trim()
      if (!raw) continue
      const slug = slugFromName(raw)
      if (!bySlug.has(slug)) bySlug.set(slug, { name: brandDisplayName(raw), slug, logoUrl: null })
    }
  }

  if (productsRes.ok) {
    const data = await productsRes.json()
    const products = (data.items ?? data.products ?? data.results ?? []) as Array<{
      brand?: string
      manufacturer?: string
    }>
    if (Array.isArray(products)) ingestProducts(products)
  }
  if (bySlug.size < 8) {
    const legacy = await apiFetch(`${API_BASE_URL}/products?limit=500`)
    if (legacy.ok) {
      const data = await legacy.json()
      const products = (data.products ?? data.results ?? []) as Array<{
        brand?: string
        manufacturer?: string
      }>
      if (Array.isArray(products)) ingestProducts(products)
    }
  }

  if (logosRes.ok) {
    const { logos = [] } = await logosRes.json()
    for (const filename of logos) {
      const base = filename.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '').trim()
      if (!base) continue
      const slug = base.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const name = filenameToBrandName(filename)
      const logoUrl = `/brands/${filename}`
      if (bySlug.has(slug)) {
        const existing = bySlug.get(slug)!
        existing.logoUrl = logoUrl
      } else {
        bySlug.set(slug, { name, slug, logoUrl })
      }
    }
  }

  const list = Array.from(bySlug.values())
  list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  return list
}

export function BrandsSection() {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchMergedBrands()
      .then((list) => {
        if (!cancelled) setBrands(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="bg-white py-8">
        <h2 className="section-title mb-6">Trusted Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !brands.length) {
    return null
  }

  return (
    <section className="bg-white py-8">
      <h2 className="section-title mb-6">Trusted Brands</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={getBrandHref({ name: brand.name, slug: brand.slug })}
            className="flex flex-col items-center border rounded-lg p-4 bg-white hover:shadow-md transition-all hover:scale-105"
          >
            <div className="flex items-center justify-center min-h-[2.5rem] w-full">
              <BrandLogo
                brand={brand.name}
                logoSrc={brand.logoUrl ?? undefined}
                logoClassName="h-10 object-contain mx-auto"
                badgeClassName="text-xs font-semibold"
              />
            </div>
            <span className="text-sm font-semibold mt-2 text-center text-gray-700">
              {brandDisplayName(brand.name)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
