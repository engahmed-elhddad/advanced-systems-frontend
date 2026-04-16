'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductGrid } from '@/components/products/ProductGrid'
import { IndustrialFilterSidebar } from '@/components/products/IndustrialFilterSidebar'
import { ProductGridSkeleton, FilterChip, Select } from '@/components/ui'
import { searchBrowse, getBrowseFacets } from '@/features/search/services'
import { getProducts } from '@/features/products/services/catalog'
import { searchHitToApiProduct, ormProductToApiProduct } from '@/lib/productMappers'
import { trackSearch } from '@/lib/analytics'
import type { Brand, Category } from '@/types/product'

const PAGE_SIZE = 30

type SortKey = 'relevance' | 'newest' | 'popular'

const TRY_INSTEAD_QUERIES = [
  { label: '3RT1015', q: '3RT1015' },
  { label: 'Siemens PLC', q: 'Siemens PLC' },
  { label: 'ABB Drive', q: 'ABB Drive' },
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

export interface ProductBrowseClientProps {
  brands: Brand[]
  categories: Category[]
}

export function ProductBrowseClient({ brands, categories }: ProductBrowseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceQ = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const qUrl = searchParams.get('q') ?? ''
  const [qInput, setQInput] = useState(qUrl)
  useEffect(() => {
    setQInput(qUrl)
  }, [qUrl])

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const sort = (searchParams.get('sort') as SortKey) || 'relevance'
  const brandIds = useMemo(() => parseIntList('brand_id', searchParams), [searchParams])
  const categoryIds = useMemo(() => parseIntList('category_id', searchParams), [searchParams])
  const seriesVals = useMemo(
    () => searchParams.getAll('series').map((s) => s.trim()).filter(Boolean),
    [searchParams]
  )
  const availabilityVals = useMemo(
    () => searchParams.getAll('availability').map((s) => s.trim()).filter(Boolean),
    [searchParams]
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
      router.replace(s ? `/products?${s}` : '/products', { scroll: false })
    },
    [router]
  )

  const setParam = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString())
      mutate(p)
      if (p.get('page') === '1') p.delete('page')
      replaceUrl(p)
    },
    [searchParams, replaceUrl]
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

  const facetsQuery = useQuery({
    queryKey: ['browse-facets'],
    queryFn: getBrowseFacets,
    staleTime: 1_800_000,
  })
  const facets = facetsQuery.data ?? { series: [], specs: {} }

  const browseQueryKey = useMemo(() => {
    const listSort = sort === 'popular' ? 'popular' : 'newest'
    if (!hasMeiliFilters) {
      return ['product-browse', 'catalog', page, listSort] as const
    }
    return [
      'product-browse',
      'meili',
      page,
      sort,
      qUrl.trim(),
      [...brandIds].slice().sort((a, b) => a - b).join(','),
      [...categoryIds].slice().sort((a, b) => a - b).join(','),
      [...seriesVals].slice().sort().join('\0'),
      [...availabilityVals].slice().sort().join('\0'),
      [...specTokens].slice().sort().join('\0'),
    ] as const
  }, [hasMeiliFilters, page, sort, qUrl, brandIds, categoryIds, seriesVals, availabilityVals, specTokens])

  const browseQuery = useQuery({
    queryKey: browseQueryKey,
    queryFn: async () => {
      if (!hasMeiliFilters) {
        const listSort = sort === 'popular' ? 'popular' : 'newest'
        const res = await getProducts({
          page,
          size: PAGE_SIZE,
          sort: listSort,
        })
        const mapped = (res.items ?? []).map(
          (p) =>
            ormProductToApiProduct(p as unknown as Record<string, unknown>) as unknown as Record<string, unknown>,
        )
        return {
          rows: mapped,
          total: res.total ?? 0,
          pages: res.pages ?? 1,
          readinessHint: (res.total ?? 0) === 0,
        }
      }
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
    staleTime: 120_000,
    gcTime: 900_000,
    placeholderData: keepPreviousData,
  })

  const rows = browseQuery.data?.rows ?? []
  const total = browseQuery.data?.total ?? 0
  const pages = browseQuery.data?.pages ?? 1
  const readinessHint = browseQuery.data?.readinessHint ?? false
  const didYouMean = browseQuery.data?.did_you_mean ?? null
  const loading = browseQuery.isFetching
  const loadError = browseQuery.isError ? 'Unable to load products. Please try again.' : null

  const lastBrowseSearchKey = useRef('')
  useEffect(() => {
    if (!hasMeiliFilters || loading || loadError) return
    const q = qUrl.trim()
    const hasFilter =
      brandIds.length > 0 ||
      categoryIds.length > 0 ||
      seriesVals.length > 0 ||
      availabilityVals.length > 0 ||
      specTokens.length > 0
    if (!q && !hasFilter) return
    const key = `browse|${q}|${page}|${total}|${brandIds.join(',')}|${categoryIds.join(',')}|${sort}`
    if (lastBrowseSearchKey.current === key) return
    lastBrowseSearchKey.current = key
    trackSearch({
      query: q || undefined,
      total,
      page,
      has_filters: hasFilter,
    })
  }, [
    hasMeiliFilters,
    loading,
    loadError,
    qUrl,
    page,
    total,
    brandIds,
    categoryIds,
    seriesVals,
    availabilityVals,
    specTokens,
    sort,
  ])

  const onQChange = (v: string) => {
    setQInput(v)
    if (debounceQ.current) clearTimeout(debounceQ.current)
    debounceQ.current = setTimeout(() => {
      setParam((p) => {
        const t = v.trim()
        if (t) p.set('q', t)
        else p.delete('q')
        p.set('page', '1')
      })
    }, 380)
  }

  const chips = useMemo(() => {
    const out: { key: string; label: string; onRemove: () => void }[] = []
    if (qUrl.trim()) {
      out.push({
        key: `q:${qUrl}`,
        label: `Search: ${qUrl}`,
        onRemove: () =>
          setParam((p) => {
            p.delete('q')
            p.set('page', '1')
          }),
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

  const clearAll = () => router.replace('/products', { scroll: false })

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Popular' },
  ]

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#0B1F3A]/90 via-[#1a2a4a]/85 to-[#2a1f3a]/90 p-5 text-slate-100 shadow-[0_0_80px_rgba(168,85,247,0.06)] ring-1 ring-white/[0.08] backdrop-blur-sm transition-all duration-300 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">Product catalog</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter by category, brand, availability, and specifications — results update instantly.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md lg:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
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
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-shadow duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-200/40" />
              <input
                type="search"
                value={qInput}
                onChange={(e) => onQChange(e.target.value)}
                placeholder="Search part number, keyword…"
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 transition-all duration-300 focus:border-orange-400/45 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                aria-label="Search products"
              />
            </div>
            <div className="w-full shrink-0 sm:w-44">
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

          {loadError ? (
            <div
              className="rounded-2xl border border-red-400/35 bg-red-500/10 px-6 py-10 text-center shadow-[0_0_40px_rgba(239,68,68,0.08)] backdrop-blur-sm"
              role="alert"
            >
              <p className="text-base font-semibold text-white">Could not load products</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-red-100/90">{loadError}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void browseQuery.refetch()}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10"
                >
                  Try again
                </button>
                <Link
                  href="/search"
                  className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:brightness-110"
                >
                  Smart search
                </Link>
              </div>
            </div>
          ) : null}

          {hasMeiliFilters && !loading && !loadError && didYouMean && total === 0 ? (
            <div
              className="flex flex-col gap-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <p className="text-sm text-white/85">
                <span className="font-semibold text-sky-100">Did you mean</span>{' '}
                <span className="font-mono text-orange-200/95">&quot;{didYouMean}&quot;</span>?
              </p>
              <button
                type="button"
                onClick={() => {
                  setQInput(didYouMean)
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

          {!loading && !loadError && readinessHint && rows.length === 0 ? (
            <div
              className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
              role="status"
            >
              No products found. This may be due to missing catalog data (image, category, brand, description) required for
              storefront display. Use{' '}
              <code className="rounded bg-black/30 px-1">GET /api/v1/admin/products/debug-readiness</code> to inspect rows.
            </div>
          ) : null}

          <div
            className="flex items-center justify-between gap-2 text-sm text-slate-400"
            aria-live="polite"
            aria-busy={loading}
          >
            <span className={cn(loading && 'animate-pulse')}>
              {loading ? 'Updating results…' : loadError ? '—' : <>{total.toLocaleString()} products match</>}
            </span>
          </div>

          {loading ? (
            <div className="transition-opacity duration-300">
              <ProductGridSkeleton count={12} />
            </div>
          ) : loadError ? null : rows.length > 0 ? (
            <>
              <ProductGrid
                products={rows}
                productBasePath="/products"
                highlightQuery={hasMeiliFilters ? qUrl.trim() : undefined}
              />
              {pages > 1 && (
                <nav className="flex flex-wrap justify-center gap-2 pt-8" aria-label="Pagination">
                  {page > 1 && (
                    <Link
                      href={`/products?${(() => {
                        const p = new URLSearchParams(searchParams.toString())
                        p.set('page', String(page - 1))
                        return p.toString()
                      })()}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                      scroll={false}
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-3 py-2 text-sm text-slate-400">
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <Link
                      href={`/products?${(() => {
                        const p = new URLSearchParams(searchParams.toString())
                        p.set('page', String(page + 1))
                        return p.toString()
                      })()}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                      scroll={false}
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center shadow-[0_0_60px_rgba(255,122,0,0.06)] backdrop-blur-sm transition-all duration-300">
              <p className="text-base font-medium text-white/75">No products match these filters</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
                Broaden your search, try a popular query, or clear filters — results update instantly.
              </p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-white/35">Try instead</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {TRY_INSTEAD_QUERIES.map(({ label, q }) => (
                  <Link
                    key={label}
                    href={`/products?q=${encodeURIComponent(q)}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-orange-400/35 hover:bg-orange-500/10"
                >
                  Clear all filters
                </button>
                <Link
                  href="/search"
                  className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:brightness-110"
                >
                  Smart search
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
