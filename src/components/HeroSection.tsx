'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '@/features/search/components/SearchBar'
import { getBrandHref } from '@/lib/brandUtils'

const HERO_IMAGE = '/industrial-automation-hero.png'
const HERO_IMAGE_FALLBACK = '/hero-industrial.svg'

const TOP_BRANDS = [
  { name: 'Siemens', slug: 'siemens' },
  { name: 'Schneider', slug: 'schneider' },
  { name: 'Omron', slug: 'omron' },
  { name: 'ABB', slug: 'abb' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
]

const TOP_CATEGORIES = [
  { name: 'PLC', slug: 'plc' },
  { name: 'Sensors', slug: 'sensors' },
  { name: 'Contactors', slug: 'contactors' },
  { name: 'Power Supplies', slug: 'power-supply' },
  { name: 'Drives', slug: 'drives' },
]

function categoryHref(slug: string): string {
  return slug ? `/categories/${encodeURIComponent(slug)}` : '/search'
}

export function HeroSection() {
  const [imgError, setImgError] = useState(false)

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,.03) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative page-container py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left: headline, search, quick links */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              Industrial Automation Components Marketplace
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
              Source industrial automation parts by part number, brand, or category.
            </p>

            {/* Large centered search bar */}
            <div className="w-full max-w-2xl mb-10">
              <SearchBar
                placeholder="Part number, brand, or category..."
                size="lg"
                showSuggestions
                debounceMs={300}
                className="shadow-lg ring-1 ring-slate-200/80 rounded-xl overflow-hidden"
              />
            </div>

            {/* Quick links: Top Brands + Top Categories */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Top Brands
                </p>
                <ul className="flex flex-wrap gap-2">
                  {TOP_BRANDS.map((brand) => (
                    <li key={brand.slug}>
                      <Link
                        href={getBrandHref({ name: brand.name, slug: brand.slug })}
                        className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-accent-400 hover:text-accent-700 hover:bg-accent-50/50 transition-colors"
                      >
                        {brand.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Top Categories
                </p>
                <ul className="flex flex-wrap gap-2">
                  {TOP_CATEGORIES.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={categoryHref(cat.slug)}
                        className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-accent-400 hover:text-accent-700 hover:bg-accent-50/50 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right: industrial visual */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px]">
              {!imgError ? (
                <Image
                  src={HERO_IMAGE}
                  alt="Industrial automation components — PLCs, drives, sensors"
                  width={420}
                  height={360}
                  className="w-full h-auto object-contain drop-shadow-xl"
                  priority
                  unoptimized
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full aspect-[7/6] flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner">
                  <Image
                    src={HERO_IMAGE_FALLBACK}
                    alt="Industrial automation"
                    width={320}
                    height={260}
                    className="w-full h-full object-contain opacity-90"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
