'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cpu, Zap, Radio, Gauge, Boxes, Wrench, Wifi, Activity } from 'lucide-react'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/lib/constants'

const CATEGORY_GRID = [
  { icon: Cpu,      label: 'PLCs' },
  { icon: Zap,      label: 'Power' },
  { icon: Radio,    label: 'Sensors' },
  { icon: Gauge,    label: 'Drives' },
  { icon: Boxes,    label: 'Inventory' },
  { icon: Wrench,   label: 'Maintenance' },
  { icon: Wifi,     label: 'IoT' },
  { icon: Activity, label: 'Analytics' },
]

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function QuickBrandCard({ name, slug }: { name: string; slug: string }) {
  const [logoError, setLogoError] = useState(false)
  return (
    <Link
      href={getBrandHref({ name, slug })}
      className="flex w-20 flex-col items-center justify-center rounded-lg border border-[--border] bg-[--bg-elevated] p-3 transition-colors hover:border-[--accent]"
    >
      {!logoError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/brands/${slug}.png`}
          alt=""
          className="mb-1.5 h-8 min-h-[2rem] w-full object-contain"
          onError={() => setLogoError(true)}
        />
      ) : null}
      <span className="text-center text-xs font-semibold leading-tight text-[--text-secondary]">{name}</span>
    </Link>
  )
}

function useQuickBrands(limit: number) {
  const [brands, setBrands] = useState<{ name: string; slug: string }[]>([])
  useEffect(() => {
    let cancelled = false
    apiFetch(`${API_BASE_URL}/api/v1/brands/`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data as { brands?: unknown[] })?.brands
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
    return () => {
      cancelled = true
    }
  }, [limit])
  return brands
}

export function HeroSection() {
  const quickBrands = useQuickBrands(8)
  return (
    <section
      className="relative flex min-h-[82vh] w-full flex-col justify-center"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="relative w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-24">

          {/* Left — headline + CTAs + brands */}
          <div className="flex flex-col text-center lg:text-left">
            <p className="text-label-caps mb-5 text-[--text-secondary]">Industrial automation marketplace</p>
            <h1 className="text-display-tight mb-7 text-4xl font-semibold text-[--text-primary] sm:text-5xl md:text-[3.25rem] lg:text-[3.5rem]">
              Parts that power{' '}
              <span className="text-[--accent]">your line</span>
            </h1>
            <p className="mx-auto mb-12 max-w-xl text-[1.0625rem] font-normal leading-[1.65] tracking-[-0.01em] text-[--text-secondary] sm:text-lg lg:mx-0">
              Search millions of components by part number, brand, or category — engineered for procurement teams who
              need speed and certainty.
            </p>

            <div className="mb-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/products"
                className="bg-[--accent] hover:bg-[--accent-hover] text-white px-6 py-3 rounded-lg font-semibold"
              >
                Browse products
              </Link>
              <Link
                href="/rfq/instant"
                className="inline-flex items-center justify-center rounded-xl border border-[--border] bg-transparent px-8 py-3.5 text-sm font-semibold text-[--text-primary] transition-colors hover:bg-[--bg-elevated]"
              >
                Request quote
              </Link>
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[--text-secondary]">Trusted brands</p>
              <ul className="flex flex-wrap justify-center gap-4 lg:justify-start">
                {quickBrands.map((brand) => (
                  <li key={brand.slug}>
                    <QuickBrandCard name={brand.name} slug={brand.slug} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — category icon grid */}
          <div className="flex justify-center lg:justify-end">
            <div className="grid w-full max-w-sm grid-cols-4 gap-3">
              {CATEGORY_GRID.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-lg border border-[--border] bg-[--bg-elevated] p-4"
                >
                  <Icon className="h-6 w-6 text-[--accent]" />
                  <span className="text-xs font-medium text-[--text-secondary]">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
