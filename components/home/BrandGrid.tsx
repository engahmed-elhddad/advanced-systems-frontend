'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/app/lib/constants'

export interface BrandItem {
  name: string
  slug?: string
  product_count?: number
  count?: number
}

export interface BrandGridProps {
  /** Pre-loaded brands (optional). When not provided or empty, fetches from /brands API. */
  brands?: BrandItem[]
  title?: string
  viewAllHref?: string
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function normalizeBrands(data: unknown): BrandItem[] {
  type Row = string | { name?: string; slug?: string; product_count?: number; count?: number }
  const mapOne = (b: Row): BrandItem => {
    if (typeof b === 'string') return { name: b, slug: slugFromName(b) }
    const name = String((b as { name?: string }).name ?? '')
    return {
      name,
      slug: (b as { slug?: string }).slug ?? slugFromName(name),
      product_count: (b as { product_count?: number }).product_count,
      count: (b as { count?: number }).count,
    }
  }
  if (Array.isArray(data)) return (data as Row[]).map(mapOne)
  const list = (data as { brands?: Row[] })?.brands
  if (!Array.isArray(list)) return []
  return list.map(mapOne)
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function BrandGrid({
  brands: initialBrands,
  title = 'Brands',
  viewAllHref = '/brands',
}: BrandGridProps) {
  const [brands, setBrands] = useState<BrandItem[]>(initialBrands ?? [])
  const [loading, setLoading] = useState(!initialBrands?.length)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (initialBrands?.length) {
      setBrands(initialBrands)
      setLoading(false)
      return
    }
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
  }, [initialBrands])

  if (loading && !brands.length) {
    return (
      <section className="bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error && !brands.length) {
    return (
      <section className="bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">{title}</h2>
        </div>
        <p className="text-slate-500 text-sm">Unable to load brands. Please try again later.</p>
      </section>
    )
  }

  if (!brands?.length) return null

  return (
    <section className="bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
          >
            View all →
          </Link>
        )}
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {brands.map((brand) => (
          <motion.div key={brand.name} variants={item}>
            <Link
              href={getBrandHref(brand)}
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-accent-200 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="h-12 flex items-center justify-center">
                <BrandLogo
                  brand={brand.name}
                  logoClassName="h-10 max-w-[90px] object-contain opacity-90 group-hover:opacity-100"
                  badgeClassName="hidden"
                />
              </div>
              <span className="font-medium text-slate-800 text-sm group-hover:text-accent-700 truncate w-full text-center transition-colors">
                {brand.name}
              </span>
              {(brand.product_count ?? brand.count ?? 0) > 0 && (
                <span className="text-xs text-slate-500">
                  {brand.product_count ?? brand.count} products
                </span>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
