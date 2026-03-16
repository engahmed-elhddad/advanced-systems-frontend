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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {brands.map((brand) => (
          <div key={brand.slug} className="flex justify-center">
            <Link
              href={getBrandHref({ name: brand.name, slug: brand.slug })}
              className="group flex flex-col items-center justify-center p-6 rounded-xl bg-white border border-gray-200 transition duration-300 ease-out hover:shadow-lg hover:scale-105 cursor-pointer w-full max-w-[200px]"
            >
            <div className="flex items-center justify-center min-h-[2.5rem]">
              <BrandLogo
                brand={brand.name}
                variant="default"
                logoClassName="h-10 object-contain mb-2 transition duration-300 group-hover:scale-110"
                badgeClassName="text-xs font-semibold"
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition truncate w-full text-center">
              {brand.name}
            </span>
          </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
