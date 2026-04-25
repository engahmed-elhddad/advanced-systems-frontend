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
      className="flex w-20 flex-col items-center justify-center rounded-lg border border-white/20 bg-white/5 p-3 transition-colors hover:border-[--accent]"
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
      <span className="text-center text-xs font-semibold leading-tight text-white/70">{name}</span>
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
      <div className="w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Industrial automation marketplace
          </p>

          <h1 className="mb-7 text-5xl font-bold leading-tight text-white">
            Parts that power{' '}
            <span className="text-[--accent]">your line</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/60">
            Search millions of components by part number, brand, or category — engineered for
            procurement teams who need speed and certainty.
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="bg-[--accent] hover:bg-[--accent-hover] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse products
            </Link>
            <Link
              href="/rfq/instant"
              className="border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/5"
            >
              Request quote
            </Link>
          </div>

          {/* Trusted brands */}
          <div className="mb-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Trusted brands
            </p>
            <ul className="flex flex-wrap justify-center gap-3">
              {quickBrands.map((brand) => (
                <li key={brand.slug}>
                  <QuickBrandCard name={brand.name} slug={brand.slug} />
                </li>
              ))}
            </ul>
          </div>

          {/* Category icon grid */}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {CATEGORY_GRID.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-lg border border-white/15 bg-white/5 p-4"
              >
                <Icon className="h-6 w-6 text-[--accent]" />
                <span className="text-xs font-medium text-white/60">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
