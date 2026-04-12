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
      className="flex w-20 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all duration-300 hover:scale-[1.05] hover:border-orange-400/30 hover:bg-white/[0.08] hover:shadow-[0_0_28px_rgba(255,122,0,0.15)]"
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
      <span className="text-center text-xs font-semibold leading-tight text-white/80">{name}</span>
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
        className="aspect-[4/3] w-full max-w-[340px] animate-pulse rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm sm:max-w-[400px] lg:max-w-[460px]"
        aria-hidden
      />
    ),
  }
)

export function HeroSection() {
  const quickBrands = useQuickBrands(8)
  return (
    <section className="relative flex min-h-[82vh] w-full flex-col justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full bg-orange-500/[0.2] blur-[128px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-0 h-[min(70vw,380px)] w-[min(70vw,380px)] rounded-full bg-violet-500/[0.14] blur-[128px]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />

      <div className="relative w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col text-center lg:text-left">
            <p className="text-label-caps mb-5 text-orange-200/85">Industrial automation marketplace</p>
            <h1 className="text-display-tight mb-7 text-4xl font-semibold text-white sm:text-5xl md:text-[3.25rem] lg:text-[3.5rem]">
              Parts that power{' '}
              <span className="bg-gradient-to-r from-orange-200 via-orange-400 to-violet-200 bg-clip-text text-transparent">
                your line
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-xl text-[1.0625rem] font-normal leading-[1.65] tracking-[-0.01em] text-white/58 sm:text-lg lg:mx-0">
              Search millions of components by part number, brand, or category — engineered for procurement teams who
              need speed and certainty.
            </p>

            <div className="mx-auto mb-12 w-full lg:mx-0">
              <HeroSearch variant="hero" />
            </div>

            <div className="mb-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/35 transition-all duration-300 hover:scale-[1.03] hover:brightness-110 hover:shadow-xl hover:shadow-orange-500/45"
              >
                Browse products
              </Link>
              <Link
                href="/rfq/instant"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-orange-400/35 hover:bg-white/[0.08]"
              >
                Request quote
              </Link>
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/40">Trusted brands</p>
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
