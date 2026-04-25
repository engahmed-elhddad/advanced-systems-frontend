'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { HeroSearch } from '@/components/home/HeroSearch'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL } from '@/lib/constants'

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

const HeroVisualLazy = dynamic(
  () => import('./HeroVisual').then((m) => ({ default: m.HeroVisual })),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-[4/3] w-full max-w-[340px] animate-pulse rounded-2xl border border-[--border] bg-[--bg-elevated] sm:max-w-[400px] lg:max-w-[460px]"
        aria-hidden
      />
    ),
  }
)

export function HeroSection() {
  const quickBrands = useQuickBrands(8)
  return (
    <section
      className="relative flex min-h-[82vh] w-full flex-col justify-center"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="relative w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-24">
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

            <div className="mx-auto mb-12 w-full lg:mx-0">
              <HeroSearch variant="hero" />
            </div>

            <div className="mb-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl bg-[--accent] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
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

          <div className="flex justify-center lg:justify-end">
            <HeroVisualLazy />
          </div>
        </div>
      </div>
    </section>
  )
}
