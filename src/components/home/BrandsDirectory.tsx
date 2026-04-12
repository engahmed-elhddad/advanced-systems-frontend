'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Sparkles, Building2 } from 'lucide-react'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'

export type BrandRow = {
  id: number
  name: string
  slug?: string | null
  logo_url?: string | null
  description?: string | null
  product_count?: number | null
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function brandHref(b: BrandRow): string {
  const s = (b.slug || '').trim() || slugify(b.name)
  return `/brands/${encodeURIComponent(s || String(b.id))}`
}

function firstLetter(name: string): string {
  const c = name.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

export function BrandsDirectory({ brands }: { brands: BrandRow[] }) {
  const [query, setQuery] = useState('')
  const [letterFilter, setLetterFilter] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [brands],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter((b) => {
      const name = b.name.toLowerCase()
      const slug = (b.slug || '').toLowerCase()
      const desc = (b.description || '').toLowerCase()
      const matchQ = !q || name.includes(q) || slug.includes(q) || desc.includes(q)
      const fl = letterFilter ? firstLetter(b.name) === letterFilter : true
      return matchQ && fl
    })
  }, [sorted, query, letterFilter])

  const lettersPresent = useMemo(() => {
    const set = new Set<string>()
    sorted.forEach((b) => set.add(firstLetter(b.name)))
    return set
  }, [sorted])

  const scrollToLetter = useCallback((L: string) => {
    const el = document.getElementById(`brands-letter-${L}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const totalProducts = useMemo(
    () => sorted.reduce((acc, b) => acc + (Number(b.product_count) || 0), 0),
    [sorted],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, BrandRow[]>()
    for (const b of filtered) {
      const L = firstLetter(b.name)
      if (!map.has(L)) map.set(L, [])
      map.get(L)!.push(b)
    }
    const order = [...LETTERS, '#']
    return order
      .filter((L) => map.has(L))
      .map((L) => ({ letter: L, items: map.get(L)! }))
  }, [filtered])

  return (
    <div className="relative z-10 min-h-screen pb-24 pt-6 sm:pt-10">
      <div className="page-container">
        {/* Hero */}
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="pointer-events-none absolute -left-1/4 top-0 h-48 w-48 rounded-full bg-orange-500/20 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-1/4 bottom-0 h-40 w-40 rounded-full bg-purple-600/20 blur-[90px]"
            aria-hidden
          />
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-300/90">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Manufacturer index
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Browse by Brand</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Explore trusted industrial brands — Siemens, ABB, Schneider, Omron, and hundreds more. Find parts fast with
            search and A–Z navigation.
          </p>

          <div className="relative mx-auto mt-10 max-w-xl">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands by name…"
              className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.07] py-3 pl-12 pr-4 text-[15px] text-white shadow-[0_0_40px_rgba(255,122,0,0.08)] outline-none backdrop-blur-xl transition-all placeholder:text-white/35 focus:border-orange-400/40 focus:ring-2 focus:ring-orange-400/25"
              aria-label="Filter brands by name"
            />
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Brands', value: String(brands.length) },
              { label: 'Products indexed', value: totalProducts > 0 ? `${totalProducts.toLocaleString()}+` : 'Live' },
              { label: 'Regions', value: 'Global' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-4 text-center backdrop-blur-xl transition-all duration-300 hover:border-orange-400/20 hover:shadow-[0_0_28px_rgba(255,122,0,0.12)]"
              >
                <div className="text-xl font-bold text-orange-200 sm:text-2xl">{s.value}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* A–Z filter + jump */}
        <div className="sticky top-[3.5rem] z-30 mt-12 -mx-4 border-y border-white/[0.07] bg-[#0a1428]/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setLetterFilter(null)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                letterFilter === null
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-white shadow-lg shadow-orange-500/30'
                  : 'border border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:text-white',
              )}
            >
              All
            </button>
            {LETTERS.map((L) => {
              const has = lettersPresent.has(L)
              return (
                <button
                  key={L}
                  type="button"
                  disabled={!has}
                  onClick={() => {
                    setLetterFilter(L)
                    scrollToLetter(L)
                  }}
                  className={cn(
                    'min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-bold transition-all',
                    !has && 'cursor-not-allowed opacity-25',
                    has && letterFilter === L && 'bg-orange-500/25 text-orange-200 ring-1 ring-orange-400/40',
                    has &&
                      letterFilter !== L &&
                      'border border-white/10 text-white/60 hover:border-orange-400/30 hover:text-white',
                  )}
                >
                  {L}
                </button>
              )
            })}
            {lettersPresent.has('#') ? (
              <button
                type="button"
                onClick={() => {
                  setLetterFilter('#')
                  scrollToLetter('#')
                }}
                className={cn(
                  'rounded-lg px-2 py-1.5 text-xs font-bold',
                  letterFilter === '#'
                    ? 'bg-orange-500/25 text-orange-200 ring-1 ring-orange-400/40'
                    : 'border border-white/10 text-white/60 hover:text-white',
                )}
              >
                #
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-center text-[11px] text-white/40">
            Tip: use the header search for part numbers; this bar filters the brand directory only.
          </p>
        </div>

        {/* Grid by letter */}
        <div className="mt-12 space-y-14">
          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
              <Building2 className="mx-auto h-10 w-10 text-white/25" />
              <p className="mt-3 text-white/55">No brands match your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setLetterFilter(null)
                }}
                className="mt-4 text-sm font-semibold text-orange-300 hover:text-orange-200"
              >
                Clear filters
              </button>
            </div>
          ) : (
            grouped.map(({ letter, items }) => (
              <section key={letter} id={`brands-letter-${letter}`} className="scroll-mt-36">
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/30 to-purple-600/25 text-lg font-black text-white shadow-[0_0_24px_rgba(255,122,0,0.2)]">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">{items.length} brands</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
                  {items.map((b) => (
                    <Link
                      key={b.id}
                      href={brandHref(b)}
                      className={cn(
                        'group flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.05] p-5 text-center backdrop-blur-xl',
                        'transition-all duration-300 hover:scale-[1.03] hover:border-orange-400/35 hover:shadow-[0_0_40px_rgba(255,122,0,0.18)]',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/60',
                      )}
                    >
                      <div className="relative flex h-[76px] w-full items-center justify-center">
                        {b.logo_url ? (
                          <SafeImage
                            src={b.logo_url}
                            alt=""
                            className="max-h-11 max-w-[90%] object-contain opacity-90 grayscale transition-all duration-300 group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-100"
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] text-xl font-bold text-orange-200/90 transition-transform duration-300 group-hover:scale-105">
                            {b.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-orange-100">
                        {b.name}
                      </span>
                      {b.product_count != null && b.product_count > 0 ? (
                        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                          {b.product_count.toLocaleString()} parts
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-8 text-center backdrop-blur-xl sm:p-10">
          <h2 className="text-xl font-bold text-white">Don&apos;t see your brand?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            We source globally. Send an RFQ and our team will locate genuine parts fast.
          </p>
          <Link
            href="/rfq"
            className="mt-6 inline-flex items-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/35 transition-all hover:brightness-110"
          >
            Request a quote
          </Link>
        </div>
      </div>
    </div>
  )
}
