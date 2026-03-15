'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/app/lib/constants'

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

export function TrustedBrands() {
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
      <section className="bg-white">
        <h2 className="section-title mb-6">Trusted Brands</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !brands.length) {
    return null
  }

  return (
    <section className="bg-white">
      <h2 className="section-title mb-6">Trusted Brands</h2>
      {/* Grid: 2 cols mobile, 3 tablet (sm), 6 desktop (lg) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={getBrandHref({ name: brand.name, slug: brand.slug })}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
          >
            <div className="h-12 flex items-center justify-center w-full">
              <BrandLogo
                brand={brand.name}
                logoClassName="h-10 max-w-[90px] object-contain opacity-90 group-hover:opacity-100"
                badgeClassName="text-xs font-semibold"
              />
            </div>
            <span className="font-medium text-slate-800 text-sm text-center truncate w-full group-hover:text-accent-600 transition-colors">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
