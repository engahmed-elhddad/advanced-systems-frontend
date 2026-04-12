'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2, Search } from 'lucide-react'
import { ProductGrid } from '@/components/products/ProductGrid'
import { SafeImage } from '@/components/ui/SafeImage'
import { productsApi, searchApi, getBrandCategories } from '@/lib/api'
import { ormProductToApiProduct, searchHitToApiProduct } from '@/lib/productMappers'
import { cn } from '@/lib/utils'

export type BrandDetail = {
  id: number
  name: string
  slug?: string | null
  logo_url?: string | null
  description?: string | null
  website?: string | null
  product_count?: number | null
}

type CategoryOpt = { id: number; name: string; slug?: string | null }

const PAGE_SIZE = 24

export function BrandStorefront({ brand, slug }: { brand: BrandDetail; slug: string }) {
  const [categories, setCategories] = useState<CategoryOpt[]>([])
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [availability, setAvailability] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 320)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, categoryId, availability])

  const categoryListSlug = (brand.slug || slug).trim()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getBrandCategories(categoryListSlug)
        if (!cancelled) setCategories(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categoryListSlug])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cat = categoryId === '' ? undefined : categoryId
      const av = availability || undefined

      if (debouncedQ.length >= 1) {
        const { data } = await searchApi.search(debouncedQ, {
          page,
          size: PAGE_SIZE,
          brand_id: brand.id,
          category_id: cat,
          availability: av,
        })
        const hits = (data?.hits || data?.items || data?.products || []) as Record<string, unknown>[]
        const mapped = hits.map((h) => searchHitToApiProduct(h) as unknown as Record<string, unknown>)
        setProducts(mapped)
        setTotal(Number(data?.total ?? mapped.length))
        setPages(Math.max(1, Number(data?.pages ?? 1)))
        setSource(String(data?.source ?? ''))
      } else {
        const { data } = await productsApi.list({
          page,
          size: PAGE_SIZE,
          brand_id: brand.id,
          category_id: cat,
          availability: av,
        })
        const items = (data?.items || []) as Record<string, unknown>[]
        const mapped = items.map((p) => ormProductToApiProduct(p) as unknown as Record<string, unknown>)
        setProducts(mapped)
        setTotal(Number(data?.total ?? 0))
        setPages(Math.max(1, Number(data?.pages ?? 1)))
        setSource('catalog')
      }
    } catch {
      setProducts([])
      setTotal(0)
      setPages(1)
      setSource('')
    } finally {
      setLoading(false)
    }
  }, [brand.id, debouncedQ, page, categoryId, availability])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="relative z-10 min-h-screen pb-24 pt-6 sm:pt-10">
      <div className="page-container">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/55 transition-colors hover:text-orange-200"
        >
          <ArrowLeft className="h-4 w-4" />
          All brands
        </Link>

        {/* Brand hero */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/15 blur-[100px]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="flex shrink-0 justify-center lg:justify-start">
              {brand.logo_url ? (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] p-4 sm:h-36 sm:w-36">
                  <SafeImage
                    src={brand.logo_url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/25 to-purple-600/20 text-3xl font-black text-white sm:h-36 sm:w-36">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{brand.name}</h1>
              {brand.description ? (
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/60 lg:mx-0">{brand.description}</p>
              ) : (
                <p className="mx-auto mt-4 max-w-2xl text-base text-white/50 lg:mx-0">
                  Genuine {brand.name} industrial automation components — sourced and verified for your projects.
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {brand.product_count != null ? (
                  <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                    {brand.product_count.toLocaleString()} products
                  </span>
                ) : null}
                {brand.website?.startsWith('http') ? (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-200 transition-colors hover:bg-orange-500/20"
                  >
                    Official site
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {source ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                    {debouncedQ ? `Search · ${source}` : 'Catalog'}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Filters + search in brand */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
            <div className="relative min-w-0 flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/45">
                Search in {brand.name}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Part number, series, keyword…"
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/20 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-400/40 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/40">Powered by Meilisearch when available; otherwise database search.</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[280px]">
              <div>
                <label htmlFor="bf-cat" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Category
                </label>
                <select
                  id="bf-cat"
                  value={categoryId === '' ? '' : String(categoryId)}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-orange-400/40"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0f172a]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bf-av" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Availability
                </label>
                <select
                  id="bf-av"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/20 px-3 text-sm text-white outline-none focus:border-orange-400/40"
                >
                  <option value="">Any</option>
                  <option value="in_stock" className="bg-[#0f172a]">
                    In stock
                  </option>
                  <option value="on_request" className="bg-[#0f172a]">
                    On request
                  </option>
                  <option value="available" className="bg-[#0f172a]">
                    Available
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-orange-400/80" aria-label="Loading" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
              <p className="text-white/60">No products match these filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setCategoryId('')
                  setAvailability('')
                }}
                className="mt-4 text-sm font-semibold text-orange-300 hover:text-orange-200"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <ProductGrid products={products} columns="compact" />
              {pages > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      'rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors',
                      page <= 1 ? 'cursor-not-allowed opacity-40' : 'hover:border-orange-400/40 hover:bg-white/5',
                    )}
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm text-white/55">
                    Page {page} of {pages}
                    <span className="ml-2 text-white/35">({total.toLocaleString()} total)</span>
                  </span>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    className={cn(
                      'rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors',
                      page >= pages ? 'cursor-not-allowed opacity-40' : 'hover:border-orange-400/40 hover:bg-white/5',
                    )}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
