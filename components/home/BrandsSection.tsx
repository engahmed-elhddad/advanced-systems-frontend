'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/app/lib/constants'
import { BRAND_MAP } from '@/app/lib/brands'

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

/** Display brand name in title case; use BRAND_MAP for known brands (IFM, SICK, Siemens, etc.) */
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

function normalizeBrands(data: unknown): BrandItem[] {
  type Row = string | { name?: string; slug?: string }
  const mapOne = (b: Row): BrandItem => {
    if (typeof b === 'string') return { name: b, slug: slugFromName(b) }
    const name = String((b as { name?: string }).name ?? '')
    return { name, slug: (b as { slug?: string }).slug ?? slugFromName(name) }
  }
  if (Array.isArray(data)) return (data as Row[]).map(mapOne)
  const list = (data as { brands?: Row[] })?.brands
  if (!Array.isArray(list)) return []
  return list.map(mapOne)
}

export function BrandsSection() {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch(`${API_BASE_URL}/brands`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setBrands(normalizeBrands(data))
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {brands.map((brand) => (
          <div key={brand.slug} className="flex justify-center">
            <Link
              href={getBrandHref({ name: brand.name, slug: brand.slug })}
              className="group flex flex-col items-center justify-center py-8 px-6 rounded-xl bg-white border border-gray-200 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer w-full max-w-[220px]"
            >
              <div className="flex items-center justify-center min-h-[4rem] mb-2">
                <BrandLogo
                  brand={brand.name}
                  variant="default"
                  logoClassName="h-16 w-auto object-contain transition-all duration-200 group-hover:scale-110"
                  badgeClassName="text-xs font-semibold"
                />
              </div>
              <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-all duration-200 truncate w-full text-center">
                {brandDisplayName(brand.name)}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
