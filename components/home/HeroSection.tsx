'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/app/lib/constants'

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function useQuickBrands(limit: number) {
  const [brands, setBrands] = useState<{ name: string; slug: string }[]>([])
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/brands`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = (data as { brands?: unknown[] })?.brands
        const arr = Array.isArray(list) ? list : []
        const out = arr.slice(0, limit).map((b: unknown) => {
          if (typeof b === 'string') return { name: b, slug: slugFromName(b) }
          const o = b as { name?: string; slug?: string }
          const name = String(o?.name ?? '')
          return { name, slug: o?.slug ?? slugFromName(name) }
        })
        setBrands(out)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [limit])
  return brands
}

const HeroVisualLazy = dynamic(
  () => import('./HeroVisual').then((m) => ({ default: m.HeroVisual })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] aspect-[4/3] rounded-2xl bg-slate-700/30 animate-pulse"
        aria-hidden
      />
    ),
  }
)

export function HeroSection() {
  const quickBrands = useQuickBrands(8)
  return (
    <section className="relative w-full min-h-[80vh] overflow-hidden flex flex-col justify-center bg-slate-900">
      {/* Industrial gradient + grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(30,58,138,.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,58,138,.2) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

      <div className="relative page-container py-12 sm:py-16 lg:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* ——— LEFT: Headline, subtext, SearchBar, CTAs, quick brands ——— */}
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
              Industrial Automation Parts Marketplace
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Search millions of industrial components by part number, brand, or category.
            </p>

            <div className="w-full max-w-xl mx-auto lg:mx-0 mb-6">
              <div className="rounded-xl bg-white/95 border border-slate-600/50 shadow-xl overflow-hidden">
                <SearchBar
                  placeholder="Search by part number, brand, or category"
                  size="lg"
                  showSuggestions
                  debounceMs={300}
                  className="border-0 shadow-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/rfq/instant"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-slate-500 transition-colors"
              >
                Request Quote
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Quick brands
              </p>
              <ul className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {quickBrands.map((brand) => (
                  <li key={brand.slug}>
                    <Link
                      href={getBrandHref({ name: brand.name, slug: brand.slug })}
                      className="inline-flex px-4 py-2.5 rounded-lg text-sm font-medium text-slate-200 bg-white/5 border border-slate-600 hover:bg-white/10 hover:border-slate-500 transition-all duration-200"
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ——— RIGHT: Industrial visual ——— */}
          <div className="flex justify-center lg:justify-end">
            <HeroVisualLazy />
          </div>
        </div>
      </div>
    </section>
  )
}
