'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search/SearchBar'
import { IndustrialFilterSidebar } from '@/components/products/IndustrialFilterSidebar'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ProductGridSkeleton, FilterChip, Select } from '@/components/ui'
import { searchBrowse, getBrowseFacets } from '@/features/search/services'
import { searchHitToApiProduct } from '@/lib/productMappers'
import { trackSearch } from '@/lib/analytics'
import type { Brand, Category } from '@/types/product'

const PAGE_SIZE = 30

type SortKey = 'relevance' | 'newest' | 'popular'

const POPULAR_QUERIES = [
  { label: '3RT1015', q: '3RT1015' },
  { label: 'Siemens PLC', q: 'Siemens PLC' },
  { label: 'ABB Drive', q: 'ABB Drive' },
  { label: 'Omron Sensor', q: 'Omron Sensor' },
  { label: 'SICK photoelectric', q: 'SICK photoelectric' },
  { label: '6ES7315', q: '6ES7315' },
]

function parseIntList(key: string, sp: URLSearchParams): number[] {
  return sp
    .getAll(key)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
}

function parseSpecTokens(sp: URLSearchParams): string[] {
  return sp.getAll('spec').filter((t) => t.includes(':'))
}

export interface SearchPageClientProps {
  brands: Brand[]
  categories: Category[]
}

export function SearchPageClient({ brands, categories }: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const spKey = searchParams.toString()

  const qUrl = searchParams.get('q') ?? ''
  const [qDraft, setQDraft] = useState(qUrl)
  useEffect(() => {
    setQDraft(qUrl)
  }, [qUrl])

  const debounceQUrl = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSearchValueChange = useCallback(
    (v: string) => {
      setQDraft(v)
      if (debounceQUrl.current) clearTimeout(debounceQUrl.current)
      debounceQUrl.current = setTimeout(() => {
        const p = new URLSearchParams(spKey)
        const t = v.trim()
        if (t) p.set('q', t)
        else p.delete('q')
        p.delete('page')
        const s = p.toString()
        router.replace(s ? `/search?${s}` : '/search', { scroll: false })
      }, 300)
    },
    [router, spKey],
  )

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const sort = (searchParams.get('sort') as SortKey) || 'relevance'
  const brandIds = useMemo(() => parseIntList('brand_id', searchParams), [searchParams])
  const categoryIds = useMemo(() => parseIntList('category_id', searchParams), [searchParams])
  const seriesVals = useMemo(
    () => searchParams.getAll('series').map((s) => s.trim()).filter(Boolean),
    [searchParams],
  )
  const availabilityVals = useMemo(
    () => searchParams.getAll('availability').map((s) => s.trim()).filter(Boolean),
    [searchParams],
  )
  const specTokens = useMemo(() => parseSpecTokens(searchParams), [searchParams])

  const hasMeiliFilters =
    !!qUrl.trim() ||
    brandIds.length > 0 ||
    categoryIds.length > 0 ||
    seriesVals.length > 0 ||
    availabilityVals.length > 0 ||
    specTokens.length > 0

  const replaceUrl = useCallback(
    (next: URLSearchParams) => {
      const s = next.toString()
      router.replace(s ? `/search?${s}` : '/search', { scroll: false })
    },
    [router],
  )

  const setParam = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString())
      mutate(p)
      if (p.get('page') === '1') p.delete('page')
      replaceUrl(p)
    },
    [searchParams, replaceUrl],
  )

  const toggleId = (key: 'brand_id' | 'category_id', id: number) => {
    setParam((p) => {
      const cur = p.getAll(key).map((x) => parseInt(x, 10))
      const has = cur.includes(id)
      p.delete(key)
      for (const x of cur) {
        if (x !== id) p.append(key, String(x))
      }
      if (!has) p.append(key, String(id))
      p.set('page', '1')
    })
  }

  const toggleString = (key: 'series' | 'availability', value: string) => {
    setParam((p) => {
      const cur = p.getAll(key)
      const has = cur.includes(value)
      p.delete(key)
      for (const x of cur) {
        if (x !== value) p.append(key, x)
      }
      if (!has) p.append(key, value)
      p.set('page', '1')
    })
  }

  const toggleSpec = (token: string) => {
    setParam((p) => {
      const cur = p.getAll('spec')
      const has = cur.includes(token)
      p.delete('spec')
      for (const x of cur) {
        if (x !== token) p.append('spec', x)
      }
      if (!has) p.append('spec', token)
      p.set('page', '1')
    })
  }

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const lastSearchTrackKey = useRef<string>('')

  const facetsQuery = useQuery({
    queryKey: ['browse-facets'],
    queryFn: getBrowseFacets,
    staleTime: 1_800_000,
  })
  const facets = facetsQuery.data ?? { series: [], specs: {} }

  const searchQueryKey = useMemo(
    () =>
      [
        'search-page-browse',
        page,
        sort,
        qUrl.trim(),
        [...brandIds].slice().sort((a, b) => a - b).join(','),
        [...categoryIds].slice().sort((a, b) => a - b).join(','),
        [...seriesVals].slice().sort().join('\0'),
        [...availabilityVals].slice().sort().join('\0'),
        [...specTokens].slice().sort().join('\0'),
      ] as const,
    [page, sort, qUrl, brandIds, categoryIds, seriesVals, availabilityVals, specTokens],
  )

  const searchQuery = useQuery({
    queryKey: searchQueryKey,
    enabled: hasMeiliFilters,
    queryFn: async () => {
      const res = await searchBrowse({
        q: qUrl.trim() || undefined,
        page,
        size: PAGE_SIZE,
        brand_ids: brandIds.length ? brandIds : undefined,
        category_ids: categoryIds.length ? categoryIds : undefined,
        series_values: seriesVals.length ? seriesVals : undefined,
        availability_in: availabilityVals.length ? availabilityVals : undefined,
        spec: specTokens.length ? specTokens : undefined,
        sort: sort === 'relevance' ? 'relevance' : sort,
      })
      const hits = res.items ?? []
      return {
        rows: hits.map(
          (h) =>
            searchHitToApiProduct(h as unknown as Record<string, unknown>) as unknown as Record<string, unknown>,
        ),
        total: res.total ?? 0,
        pages: res.pages ?? 1,
        readinessHint: (res.total ?? 0) === 0,
        did_you_mean: res.did_you_mean ?? null,
      }
    },
    staleTime: 90_000,
    gcTime: 900_000,
    placeholderData: keepPreviousData,
  })

  const rows = hasMeiliFilters ? (searchQuery.data?.rows ?? []) : []
  const total = hasMeiliFilters ? (searchQuery.data?.total ?? 0) : 0
  const pages = hasMeiliFilters ? (searchQuery.data?.pages ?? 1) : 1
  const readinessHint = hasMeiliFilters ? (searchQuery.data?.readinessHint ?? false) : false
  const didYouMean = hasMeiliFilters ? (searchQuery.data?.did_you_mean ?? null) : null
  const loading = hasMeiliFilters && searchQuery.isFetching
  const searchFailed = hasMeiliFilters && searchQuery.isError

  useEffect(() => {
    if (loading || !hasMeiliFilters || searchFailed) return
    const q = qUrl.trim()
    const key = `${q}|${page}|${total}|${brandIds.join(',')}|${categoryIds.join(',')}`
    if (!q && brandIds.length + categoryIds.length + seriesVals.length === 0) return
    if (lastSearchTrackKey.current === key) return
    lastSearchTrackKey.current = key
    trackSearch({
      query: q || undefined,
      total,
      page,
      has_filters:
        brandIds.length > 0 ||
        categoryIds.length > 0 ||
        seriesVals.length > 0 ||
        availabilityVals.length > 0 ||
        specTokens.length > 0,
    })
  }, [
    loading,
    hasMeiliFilters,
    searchFailed,
    qUrl,
    page,
    total,
    brandIds,
    categoryIds,
    seriesVals,
    availabilityVals,
    specTokens,
  ])

  const chips = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = []
    if (qUrl.trim()) {
      out.push({
        key: `q:${qUrl}`,
        label: `Search: ${qUrl}`,
        onRemove: () => {
          setQDraft('')
          setParam((p) => {
            p.delete('q')
            p.set('page', '1')
          })
        },
      })
    }
    for (const id of brandIds) {
      const b = brands.find((x) => x.id === id)
      out.push({
        key: `b:${id}`,
        label: b?.name ?? `Brand #${id}`,
        onRemove: () =>
          setParam((p) => {
            p.delete('brand_id')
            for (const x of brandIds) {
              if (x !== id) p.append('brand_id', String(x))
            }
            p.set('page', '1')
          }),
      })
    }
    for (const id of categoryIds) {
      const c = categories.find((x) => x.id === id)
      out.push({
        key: `c:${id}`,
        label: c?.name ?? `Category #${id}`,
        onRemove: () =>
          setParam((p) => {
            p.delete('category_id')
            for (const x of categoryIds) {
              if (x !== id) p.append('category_id', String(x))
            }
            p.set('page', '1')
          }),
      })
    }
    for (const s of seriesVals) {
      out.push({
        key: `s:${s}`,
        label: `Series: ${s}`,
        onRemove: () =>
          setParam((p) => {
            p.delete('series')
            for (const x of seriesVals) {
              if (x !== s) p.append('series', x)
            }
            p.set('page', '1')
          }),
      })
    }
    for (const a of availabilityVals) {
      const label = a === 'in_stock' ? 'In stock' : a === 'on_request' ? 'On request' : a
      out.push({
        key: `a:${a}`,
        label,
        onRemove: () =>
          setParam((p) => {
            p.delete('availability')
            for (const x of availabilityVals) {
              if (x !== a) p.append('availability', x)
            }
            p.set('page', '1')
          }),
      })
    }
    for (const t of specTokens) {
      const [k, ...rest] = t.split(':')
      const v = rest.join(':')
      out.push({
        key: `sp:${t}`,
        label: `${k}: ${v}`,
        onRemove: () =>
          setParam((p) => {
            p.delete('spec')
            for (const x of specTokens) {
              if (x !== t) p.append('spec', x)
            }
            p.set('page', '1')
          }),
      })
    }
    return out
  }, [qUrl, brandIds, categoryIds, seriesVals, availabilityVals, specTokens, brands, categories, setParam])

  const clearAll = () => {
    setQDraft('')
    router.replace('/search', { scroll: false })
  }

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Popular' },
  ]

  const glassPanel = 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-all duration-300'

  return (
    <div className="relative pb-16 pt-6 sm:pt-10">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-orange-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-32 h-[200px] w-[200px] rounded-full bg-purple-500/20 blur-[100px]"
        aria-hidden
      />

      <div className="page-container relative z-10">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" aria-hidden />
            Meilisearch · live filters
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            Discover industrial parts
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/55 sm:text-base">
            Smart search with instant Meilisearch suggestions. Refine by category, brand, availability, and specs —
            all synced to the URL.
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-3xl">
          <SearchBar
            value={qDraft}
            onValueChange={onSearchValueChange}
            variant="hero"
            placeholder="Search part numbers, brands, series…"
            showSuggestions
            debounceMs={300}
            minLength={1}
            suggestionLimit={10}
            searchPath="/search"
            productPath="/products"
            brandPath="/brands"
            categoryPath="/categories"
            className="w-full"
          />
        </div>

        {!hasMeiliFilters && (
          <div
            className={cn(
              glassPanel,
              'mx-auto mb-10 max-w-2xl px-6 py-14 text-center transition-all duration-300',
            )}
          >
            <p className="text-lg font-semibold text-white">Start typing to search the catalog</p>
            <p className="mt-2 text-sm text-white/50">Or pick a popular query — filters apply instantly with no full page reload.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {POPULAR_QUERIES.map(({ label, q: qq }) => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(qq)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10 hover:text-orange-100"
                >
                  {label}
                </Link>
              ))}
            </div>
            <Link
              href="/products"
              className="mt-8 inline-block text-sm font-semibold text-violet-300/90 transition-colors hover:text-violet-200"
            >
              Browse full product catalog →
            </Link>
          </div>
        )}

        {hasMeiliFilters && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <button
              type="button"
              className={cn(
                glassPanel,
                'inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white lg:hidden',
              )}
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>

            <div className={cn('lg:block', mobileFiltersOpen ? 'block' : 'hidden')}>
              <IndustrialFilterSidebar
                brands={brands}
                categories={categories}
                facets={facets}
                categoryIds={categoryIds}
                brandIds={brandIds}
                seriesVals={seriesVals}
                availabilityVals={availabilityVals}
                specTokens={specTokens}
                onToggleCategory={(id) => toggleId('category_id', id)}
                onToggleBrand={(id) => toggleId('brand_id', id)}
                onToggleSeries={(s) => toggleString('series', s)}
                onToggleAvailability={(a) => toggleString('availability', a)}
                onToggleSpec={toggleSpec}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div
                className={cn(
                  glassPanel,
                  'flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                )}
              >
                <div className="w-full shrink-0 sm:max-w-[220px] sm:ml-auto sm:order-2">
                  <Select
                    value={sort}
                    onChange={(v) =>
                      setParam((p) => {
                        if (v === 'relevance') p.delete('sort')
                        else p.set('sort', v)
                        p.set('page', '1')
                      })
                    }
                    options={sortOptions}
                    placeholder="Sort"
                    className="border-white/15 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  />
                </div>
                <p className="text-sm text-white/55 sm:order-1" aria-live="polite" aria-busy={loading}>
                  <span className={cn(loading && 'animate-pulse')}>
                    {loading ? (
                      'Updating results…'
                    ) : (
                      <>
                        <span className="font-semibold text-white">{total.toLocaleString()}</span> results
                        {qUrl.trim() ? (
                          <>
                            {' '}
                            for <span className="text-orange-200/95">&quot;{qUrl}&quot;</span>
                          </>
                        ) : null}
                      </>
                    )}
                  </span>
                </p>
              </div>

              {chips.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 sm:mr-1">Active filters</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {chips.map((c) => (
                      <FilterChip key={c.key} label={c.label} value="" onRemove={c.onRemove} variant="neutral" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-orange-200/90 transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10 sm:ml-auto"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {hasMeiliFilters && !loading && !searchFailed && didYouMean && total === 0 ? (
                <div
                  className={cn(
                    glassPanel,
                    'flex flex-col gap-3 border border-sky-400/30 bg-sky-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
                  )}
                  role="status"
                >
                  <p className="text-sm text-white/85">
                    <span className="font-semibold text-sky-100">Did you mean</span>{' '}
                    <span className="font-mono text-orange-200/95">&quot;{didYouMean}&quot;</span>?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQDraft(didYouMean)
                      setParam((p) => {
                        p.set('q', didYouMean)
                        p.set('page', '1')
                      })
                      trackSearch({
                        query: didYouMean,
                        total: 0,
                        page: 1,
                        has_filters: false,
                      })
                    }}
                    className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/15"
                  >
                    Search this instead
                  </button>
                </div>
              ) : null}

              {searchFailed ? (
                <div
                  className={cn(
                    glassPanel,
                    'border-red-400/35 bg-red-500/10 px-6 py-12 text-center',
                  )}
                  role="alert"
                >
                  <p className="text-lg font-semibold text-white">Could not load search results</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
                    The search service may be unavailable. Check your connection and try again.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => void searchQuery.refetch()}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                    >
                      Try again
                    </button>
                    <Link
                      href="/products"
                      className="rounded-full border border-white/20 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/10"
                    >
                      Browse catalog
                    </Link>
                  </div>
                </div>
              ) : loading ? (
                <div className="transition-opacity duration-300">
                  <ProductGridSkeleton count={12} />
                </div>
              ) : rows.length > 0 ? (
                <>
                  <div className={cn(glassPanel, 'p-4 sm:p-5')}>
                    <ProductGrid products={rows} productBasePath="/products" highlightQuery={qUrl.trim()} />
                  </div>
                  {pages > 1 && (
                    <nav className="flex flex-wrap justify-center gap-2 pt-4" aria-label="Pagination">
                      {page > 1 && (
                        <Link
                          href={`/search?${(() => {
                            const p = new URLSearchParams(searchParams.toString())
                            p.set('page', String(page - 1))
                            return p.toString()
                          })()}`}
                          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                          scroll={false}
                        >
                          Previous
                        </Link>
                      )}
                      <span className="px-3 py-2 text-sm text-white/45">
                        Page {page} of {pages}
                      </span>
                      {page < pages && (
                        <Link
                          href={`/search?${(() => {
                            const p = new URLSearchParams(searchParams.toString())
                            p.set('page', String(page + 1))
                            return p.toString()
                          })()}`}
                          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                          scroll={false}
                        >
                          Next
                        </Link>
                      )}
                    </nav>
                  )}
                </>
              ) : (
                <div
                  className={cn(
                    glassPanel,
                    'border-dashed border-white/20 px-6 py-16 text-center transition-all duration-300',
                  )}
                >
                  {readinessHint ? (
                    <p className="mb-4 rounded-lg border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      No products found. This may be due to missing data (image, category, brand, description) required for
                      storefront display.
                    </p>
                  ) : null}
                  <p className="font-medium text-white/80">No products match your search and filters.</p>
                  <p className="mt-2 text-sm text-white/45">
                    Try a shorter keyword, clear filters, or explore a popular search below.
                  </p>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-white/40">Try instead</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {POPULAR_QUERIES.map(({ label, q: qq }) => (
                      <Link
                        key={label}
                        href={`/search?q=${encodeURIComponent(qq)}`}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                    >
                      Reset all
                    </button>
                    <Link
                      href="/products"
                      className="rounded-full border border-white/20 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500/10"
                    >
                      Browse catalog
                    </Link>
                    <Link
                      href={qUrl.trim() ? `/rfq?part=${encodeURIComponent(qUrl.trim())}` : '/rfq'}
                      className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:brightness-110"
                    >
                      Request a quote
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
