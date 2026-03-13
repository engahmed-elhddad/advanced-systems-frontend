"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { API_BASE_URL, CATEGORIES, rfqMailtoHref, slugToCategory, resolveProductImageUrl } from "@/app/lib/constants"
import { MailIcon } from "@/components/ui/MailIcon"
import { BrandLogo } from "@/components/ui/BrandLogo"
import { ProductCard } from "@/components/products/ProductCard"

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ProductSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="aspect-square bg-gray-100 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 bg-gray-100 rounded skeleton" />
        <div className="h-4 w-28 bg-gray-100 rounded skeleton" />
        <div className="h-3 w-full bg-gray-100 rounded skeleton" />
        <div className="h-8 w-full bg-gray-100 rounded mt-2 skeleton" />
      </div>
    </div>
  )
}

function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") ?? ""
  const categorySlug = searchParams.get("category") ?? ""
  const brandParam = searchParams.get("brand") ?? ""
  const pageParam = Number(searchParams.get("page")) || 1

  const [query, setQuery] = useState(q)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [brands, setBrands] = useState<string[]>([])

  const API = API_BASE_URL

  useEffect(() => { setQuery(q) }, [q])

  useEffect(() => {
    if (!q) return
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q, page: String(pageParam), size: "20" })
        if (categorySlug) params.set("category", slugToCategory(categorySlug) ?? categorySlug)
        if (brandParam) params.set("brand", brandParam)

        const res = await fetch(`${API}/api/v1/search/?${params}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const items = data.hits ?? data.items ?? data.products ?? []
        setProducts(items)
        setTotalPages(data.pages ?? Math.ceil((data.total ?? 0) / 20) || 1)
        setTotalCount(data.total ?? items.length)
        const bSet = new Set<string>()
        for (const p of items) {
          const b = p.brand?.name ?? p.manufacturer ?? p.brand_name
          if (b) bSet.add(b)
        }
        if (bSet.size) setBrands([...bSet].sort())
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [q, categorySlug, brandParam, pageParam, API])

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v != null && v !== "") params.set(k, v)
      else params.delete(k)
    }
    if (!("page" in updates)) params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ q: query, category: null, brand: null })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-16 z-10 border-b border-gray-200 bg-white/95 backdrop-blur py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search part number, brand, or description…"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:bg-white transition text-sm"
              />
            </div>
            <button type="submit" className="btn-primary px-5 py-2.5 whitespace-nowrap">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Category</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => navigate({ category: null })}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${!categorySlug ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  All Categories
                </button>
              </li>
              {CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <button
                    onClick={() => navigate({ category: cat.slug })}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${categorySlug === cat.slug ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {brands.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Brand</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => navigate({ brand: null })}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${!brandParam ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    All Brands
                  </button>
                </li>
                {brands.slice(0, 10).map(b => (
                  <li key={b}>
                    <button
                      onClick={() => navigate({ brand: b })}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${brandParam === b ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {b}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-gray-500">
              {q ? (
                <>
                  <span className="font-semibold text-gray-900">{totalCount || products.length}</span> results for{" "}
                  <span className="text-primary-600 font-medium">&quot;{q}&quot;</span>
                  {categorySlug && <span className="ml-2">in <span className="text-primary-600">{slugToCategory(categorySlug) ?? categorySlug}</span></span>}
                  {brandParam && <span className="ml-2">by <span className="text-primary-600">{brandParam}</span></span>}
                </>
              ) : (
                <span>Enter a search term to find parts</span>
              )}
            </div>
            {(categorySlug || brandParam) && (
              <button
                onClick={() => navigate({ category: null, brand: null })}
                className="text-xs text-gray-500 hover:text-primary-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-primary-300 transition"
              >
                Clear filters ×
              </button>
            )}
          </div>

          {!q && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
                <SearchIcon />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Search Industrial Parts</h2>
              <p className="text-gray-600 mb-6">Enter a part number, brand, or description to find components</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Siemens", "ABB", "Omron", "SICK", "Pilz"].map(b => (
                  <Link key={b} href={`/brand/${b.toLowerCase()}`} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition">
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {q && loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          )}

          {q && !loading && products.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
              <p className="text-gray-600 mb-6">Try a different search term or submit an RFQ for sourcing</p>
              <Link href={`/rfq?part=${encodeURIComponent(q)}`} className="btn-primary">
                Submit RFQ for &quot;{q}&quot; →
              </Link>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard
                    key={p.part_number}
                    part_number={p.part_number}
                    manufacturer={p.brand?.name ?? p.manufacturer}
                    category={p.category?.name ?? p.category}
                    description={p.description}
                    image_url={p.images?.[0]?.url ?? resolveProductImageUrl(p, API)}
                    stock_quantity={p.stock_quantity}
                    availability={p.availability === 'in_stock' || (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'on_request'}
                    price_usd={p.price_usd}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {pageParam > 1 && (
                    <button onClick={() => navigate({ page: String(pageParam - 1) })} className="btn-secondary px-4 py-2">
                      ← Prev
                    </button>
                  )}
                  <span className="text-sm text-gray-500">Page {pageParam} of {totalPages}</span>
                  {pageParam < totalPages && (
                    <button onClick={() => navigate({ page: String(pageParam + 1) })} className="btn-secondary px-4 py-2">
                      Next →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Loading search…</div>}>
      <SearchResults />
    </Suspense>
  )
}
