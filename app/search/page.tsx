"use client"

import React, { useEffect, useState, Suspense, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import { API_BASE_URL, slugToCategory, categoryToSlug } from "@/app/lib/constants"
import { ProductGrid } from "@/components/products/ProductGrid"
import {
  ProductGridSkeleton,
  EmptyState,
  Pagination,
  FilterChip,
  Select,
  Spinner,
} from "@/components/ui"

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

const POPULAR_QUERIES = [
  { label: "3RT1015", q: "3RT1015" },
  { label: "Siemens PLC", q: "Siemens PLC" },
  { label: "contactor 9A 24V", q: "contactor 9A 24V" },
  { label: "ABB Drive", q: "ABB Drive" },
  { label: "Omron Sensor", q: "Omron Sensor" },
  { label: "SICK photoelectric", q: "SICK photoelectric" },
]

function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const q = searchParams.get("q") ?? ""
  const categorySlug = searchParams.get("category") ?? ""
  const brandParam = searchParams.get("brand") ?? ""
  const manufacturerParam = searchParams.get("manufacturer") ?? ""
  const seriesParam = searchParams.get("series") ?? ""
  const conditionParam = searchParams.get("condition") ?? ""
  const voltageParam = searchParams.get("voltage") ?? ""
  const currentParam = searchParams.get("current") ?? ""
  const mountingParam = searchParams.get("mounting_type") ?? ""
  const pageParam = Number(searchParams.get("page")) || 1

  const [query, setQuery] = useState(q)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [brands, setBrands] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [sort, setSort] = useState<'relevance' | 'price_low' | 'price_high'>('relevance')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [alternatives, setAlternatives] = useState<any[]>([])
  const [didYouMeanSuggestions, setDidYouMeanSuggestions] = useState<string[]>([])
  const [filterOptions, setFilterOptions] = useState<{
    brands?: string[]
    categories?: string[]
    series?: string[]
    voltage?: string[]
    current?: string[]
    mounting_type?: string[]
  }>({})
  const [filtersWithCounts, setFiltersWithCounts] = useState<{
    brands?: { name: string; count: number }[]
    categories?: { name: string; count: number }[]
    manufacturers?: { name: string; count: number }[]
  }>({})
  const suggestDebounceRef = useRef<NodeJS.Timeout>()

  const API = API_BASE_URL

  const sortedProducts = useMemo(() => {
    let copy = [...products]
    if (conditionParam) {
      const cond = conditionParam.toLowerCase()
      copy = copy.filter((p) => {
        const c = (p.condition ?? p.product_condition ?? "").toString().toLowerCase()
        return c === cond || c.includes(cond)
      })
    }
    if (sort === "price_low") copy.sort((a, b) => (a.price_usd ?? 999999) - (b.price_usd ?? 999999))
    else if (sort === "price_high") copy.sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0))
    return copy
  }, [products, sort, conditionParam])

  useEffect(() => { setQuery(q) }, [q])

  // Auto-focus input when landing with no query
  useEffect(() => {
    if (!q && inputRef.current) inputRef.current.focus()
  }, [])

  // Live autocomplete
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    clearTimeout(suggestDebounceRef.current)
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search/suggest?q=${encodeURIComponent(term)}&limit=8`)
        const data = await res.json()
        const items = data.suggestions ?? []
        setSuggestions(items)
        setShowSuggestions(items.length > 0)
        setActiveSuggestion(-1)
      } catch {
        setSuggestions([])
      }
    }, 250)
    return () => clearTimeout(suggestDebounceRef.current)
  }, [query, API])

  // Dynamic filters: /search/filter-options = single source for brands, categories, series (and voltage, current, mounting_type)
  useEffect(() => {
    fetch(`${API}/search/filter-options`)
      .then((r) => r.json())
      .then((d) => setFilterOptions(d))
      .catch(() => {})
  }, [API])

  // Optional: /filters for counts (brands, categories, manufacturers) to show "Siemens (42)" in sidebar
  useEffect(() => {
    fetch(`${API}/filters`)
      .then((r) => r.json())
      .then((d) => setFiltersWithCounts(d))
      .catch(() => {})
  }, [API])

  const limit = 30
  const hasSearchOrFilters = !!(q || categorySlug || brandParam || manufacturerParam || seriesParam || voltageParam || currentParam || mountingParam)
  useEffect(() => {
    if (!hasSearchOrFilters) {
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
      return
    }
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set("q", q)
        params.set("limit", String(limit))
        params.set("page", String(pageParam))
        if (categorySlug) params.set("category", slugToCategory(categorySlug) ?? categorySlug)
        if (brandParam) params.set("brand", brandParam)
        if (manufacturerParam) params.set("manufacturer", manufacturerParam)
        if (seriesParam) params.set("series", seriesParam)
        if (conditionParam) params.set("condition", conditionParam)
        if (voltageParam) params.set("voltage", voltageParam)
        if (currentParam) params.set("current", currentParam)
        if (mountingParam) params.set("mounting_type", mountingParam)

        const res = await fetch(`${API}/search?${params}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const items = data.results ?? data.hits ?? data.items ?? data.products ?? []
        setProducts(items)
        const total = data.total ?? data.count ?? items.length
        setTotalCount(total)
        setTotalPages(Math.max(1, Math.ceil(total / limit)))
        setBrands(data.brands ?? [])
        const bSet = new Set<string>(data.brands ?? [])
        for (const p of items) {
          const b = p.brand ?? p.manufacturer ?? p.brand_name
          if (b) bSet.add(b)
        }
        if (bSet.size && !data.brands?.length) setBrands([...bSet].sort())
        setAlternatives(data.alternatives ?? [])
      } catch {
        setProducts([])
        setAlternatives([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hasSearchOrFilters, q, categorySlug, brandParam, manufacturerParam, seriesParam, conditionParam, voltageParam, currentParam, mountingParam, pageParam, API])

  // When no results but we have a query, fetch "Did you mean" suggestions (closest part numbers)
  useEffect(() => {
    if (!q?.trim() || loading || products.length > 0) {
      setDidYouMeanSuggestions([])
      return
    }
    fetch(`${API}/search/suggest?q=${encodeURIComponent(q.trim())}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data?.suggestions ?? []
        const list = raw.map((s: unknown) =>
          typeof s === "string" ? s : (s as { part_number?: string })?.part_number
        ).filter(Boolean) as string[]
        setDidYouMeanSuggestions(list.slice(0, 5))
      })
      .catch(() => setDidYouMeanSuggestions([]))
  }, [q, loading, products.length, API])

  const hasFilters = !!(categorySlug || brandParam || manufacturerParam || seriesParam || conditionParam || voltageParam || currentParam || mountingParam)

  function navigate(updates: Record<string, string | null | undefined>) {
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
    setShowSuggestions(false)
    navigate({ q: query, category: null, brand: null })
  }

  function selectSuggestion(s: { part_number: string }) {
    setShowSuggestions(false)
    router.push(`/part-number/${encodeURIComponent(s.part_number)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveSuggestion((i) => (i < suggestions.length - 1 ? i + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveSuggestion((i) => (i > 0 ? i - 1 : suggestions.length - 1))
    } else if (e.key === "Enter" && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      e.preventDefault()
      selectSuggestion(suggestions[activeSuggestion])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setActiveSuggestion(-1)
    }
  }

  // Single source: filter-options from API (brands, categories, series). Use /filters only for optional counts.
  const categoryNames = filterOptions.categories ?? []
  const brandNames = filterOptions.brands ?? []
  const seriesList = filterOptions.series ?? []
  const countByCategory = (filtersWithCounts.categories ?? []).reduce((acc, c) => { acc[c.name] = c.count; return acc }, {} as Record<string, number>)
  const countByBrand = (filtersWithCounts.brands ?? []).reduce((acc, b) => { acc[b.name] = b.count; return acc }, {} as Record<string, number>)
  const allManufacturers = filtersWithCounts.manufacturers ?? []

  const CONDITION_OPTIONS = [
    { value: "", label: "Any condition" },
    { value: "new", label: "New" },
    { value: "refurbished", label: "Refurbished" },
    { value: "surplus", label: "Surplus" },
  ]

  const FilterSidebar = () => (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
        <ul className="space-y-0.5 max-h-52 overflow-y-auto">
          <li>
            <button
              onClick={() => { navigate({ category: null }); setMobileFiltersOpen(false) }}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${!categorySlug ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              All Categories
            </button>
          </li>
          {categoryNames.map((cat) => {
            const slug = categoryToSlug(cat)
            const count = countByCategory[cat]
            return (
              <li key={cat}>
                <button
                  onClick={() => { navigate({ category: slug }); setMobileFiltersOpen(false) }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${categorySlug === slug ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {cat}{count != null ? ` (${count})` : ""}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Brand</h3>
        <ul className="space-y-0.5 max-h-52 overflow-y-auto">
          <li>
            <button
              onClick={() => { navigate({ brand: null }); setMobileFiltersOpen(false) }}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${!brandParam ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              All Brands
            </button>
          </li>
          {brandNames.slice(0, 100).map((b) => {
            const count = countByBrand[b]
            return (
              <li key={b}>
                <button
                  onClick={() => { navigate({ brand: b }); setMobileFiltersOpen(false) }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${brandParam === b ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {b}{count != null ? ` (${count})` : ""}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Series</h3>
        <ul className="space-y-0.5 max-h-52 overflow-y-auto">
          <li>
            <button
              onClick={() => { navigate({ series: null }); setMobileFiltersOpen(false) }}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${!seriesParam ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
            >
              All Series
            </button>
          </li>
          {seriesList.slice(0, 50).map((s: string) => (
            <li key={s}>
              <button
                onClick={() => { navigate({ series: s }); setMobileFiltersOpen(false) }}
                className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${seriesParam === s ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Condition</h3>
        <ul className="space-y-0.5">
          {CONDITION_OPTIONS.map((opt) => (
            <li key={opt.value || "any"}>
              <button
                onClick={() => { navigate({ condition: opt.value || null }); setMobileFiltersOpen(false) }}
                className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${conditionParam === opt.value ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {allManufacturers.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Manufacturer</h3>
          <ul className="space-y-0.5 max-h-52 overflow-y-auto">
            <li>
              <button
                onClick={() => { navigate({ manufacturer: null }); setMobileFiltersOpen(false) }}
                className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${!manufacturerParam ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                All Manufacturers
              </button>
            </li>
            {allManufacturers.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => { navigate({ manufacturer: item.name }); setMobileFiltersOpen(false) }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${manufacturerParam === item.name ? "bg-accent-50 text-accent-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {item.name}{item.count != null ? ` (${item.count})` : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {((filterOptions.voltage?.length ?? 0) > 0 || (filterOptions.current?.length ?? 0) > 0 || (filterOptions.mounting_type?.length ?? 0) > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Specifications</h3>
          <div className="space-y-3">
            {filterOptions.voltage?.length ? (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Voltage</label>
                <select
                  value={voltageParam}
                  onChange={(e) => { navigate({ voltage: e.target.value || null }); setMobileFiltersOpen(false) }}
                  className="w-full text-sm rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">Any</option>
                  {filterOptions.voltage.slice(0, 12).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ) : null}
            {filterOptions.current?.length ? (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Current</label>
                <select
                  value={currentParam}
                  onChange={(e) => { navigate({ current: e.target.value || null }); setMobileFiltersOpen(false) }}
                  className="w-full text-sm rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">Any</option>
                  {filterOptions.current.slice(0, 12).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ) : null}
            {filterOptions.mounting_type?.length ? (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Mounting</label>
                <select
                  value={mountingParam}
                  onChange={(e) => { navigate({ mounting_type: e.target.value || null }); setMobileFiltersOpen(false) }}
                  className="w-full text-sm rounded-md border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="">Any</option>
                  {filterOptions.mounting_type.slice(0, 10).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search bar – industrial */}
      <div className="sticky top-16 z-20 border-b border-gray-200 bg-white py-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                <SearchIcon />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Search part number, brand, or description…"
                className="w-full pl-11 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition text-sm"
                autoComplete="off"
                aria-label="Search industrial parts"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-autocomplete="list"
              />
              {loading && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Spinner size="sm" />
                </span>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                  role="listbox"
                >
                  {suggestions.map((s: any, i: number) => (
                    <div
                      key={s.part_number || i}
                      role="option"
                      aria-selected={activeSuggestion === i}
                      onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                      onMouseEnter={() => setActiveSuggestion(i)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${activeSuggestion === i ? "bg-primary-50" : "hover:bg-gray-50"}`}
                    >
                      <span className="font-mono text-primary-600 text-sm font-medium">{s.part_number}</span>
                      {s.brand && <span className="text-xs text-gray-500">{s.brand}</span>}
                      {s.category && <span className="text-xs text-gray-400">{s.category}</span>}
                    </div>
                  ))}
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-primary-600 font-medium hover:bg-primary-50 border-t border-gray-100 transition-colors"
                  >
                    <SearchIcon />
                    View all results for &quot;{query.trim()}&quot;
                  </Link>
                </div>
              )}
            </div>
            <button type="submit" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm whitespace-nowrap transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-6 lg:gap-8">
        {/* Left sidebar – filters */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-4">
          <FilterSidebar />
        </aside>

        {/* Mobile filter overlay */}
        {mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
              aria-hidden
            />
            <aside className="fixed top-[5.5rem] left-0 right-0 bottom-0 z-40 overflow-y-auto bg-white p-4 lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ×
                </button>
              </div>
              <div className="space-y-6">
                <FilterSidebar />
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0">
          {/* Results header + filters + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="text-sm text-gray-600">
                {q ? (
                  <>
                    <span className="font-bold text-gray-900">{conditionParam ? sortedProducts.length : (totalCount || products.length)}</span> Products found for{" "}
                    <span className="text-primary-600 font-medium">&quot;{q}&quot;</span>
                    {categorySlug && (
                      <span className="ml-2">
                        in <span className="text-primary-600">{slugToCategory(categorySlug) ?? categorySlug}</span>
                      </span>
                    )}
                    {brandParam && (
                      <span className="ml-2">
                        by <span className="text-primary-600">{brandParam}</span>
                      </span>
                    )}
                    {(seriesParam || voltageParam || currentParam || mountingParam) && (
                      <span className="ml-2 text-gray-500">
                        {[seriesParam, voltageParam, currentParam, mountingParam].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </>
                ) : (
                  <span>Enter a search term to find parts</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {(categorySlug || brandParam || manufacturerParam || seriesParam || conditionParam || voltageParam || currentParam || mountingParam) && (
                <div className="flex gap-2 flex-wrap">
                  {categorySlug && (
                    <FilterChip variant="accent" label="Category" value={slugToCategory(categorySlug) ?? categorySlug} onRemove={() => navigate({ category: null })} />
                  )}
                  {brandParam && (
                    <FilterChip variant="accent" label="Brand" value={brandParam} onRemove={() => navigate({ brand: null })} />
                  )}
                  {manufacturerParam && (
                    <FilterChip variant="accent" label="Manufacturer" value={manufacturerParam} onRemove={() => navigate({ manufacturer: null })} />
                  )}
                  {seriesParam && (
                    <FilterChip variant="accent" label="Series" value={seriesParam} onRemove={() => navigate({ series: null })} />
                  )}
                  {conditionParam && (
                    <FilterChip variant="accent" label="Condition" value={conditionParam} onRemove={() => navigate({ condition: null })} />
                  )}
                  {voltageParam && (
                    <FilterChip variant="accent" label="Voltage" value={voltageParam} onRemove={() => navigate({ voltage: null })} />
                  )}
                  {currentParam && (
                    <FilterChip variant="accent" label="Current" value={currentParam} onRemove={() => navigate({ current: null })} />
                  )}
                  {mountingParam && (
                    <FilterChip variant="accent" label="Mounting" value={mountingParam} onRemove={() => navigate({ mounting_type: null })} />
                  )}
                </div>
              )}
              {q && products.length > 0 && (
                <Select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'relevance' | 'price_low' | 'price_high')}
                  className="w-auto min-w-[160px] text-sm py-2"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </Select>
              )}
            </div>
          </div>

          {/* Empty state - no query */}
          {!q && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Search className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Search Industrial Parts</h2>
              <p className="text-gray-600 mb-6">Enter a part number, brand, or description to find components</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {POPULAR_QUERIES.map(({ label, q: queryParam }) => (
                  <Link
                    key={label}
                    href={`/search?q=${encodeURIComponent(queryParam)}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {q && loading && <ProductGridSkeleton count={8} />}

          {/* No results */}
          {q && !loading && products.length === 0 && (
            <div className="text-center py-12">
              <EmptyState
                icon="🔍"
                title="No results found"
                description="Try a different search term or broaden your filters. We can also help source parts via RFQ."
                action={
                  <Link href={`/rfq?part=${encodeURIComponent(q)}`} className="btn-primary">
                    Submit RFQ for &quot;{q}&quot; →
                  </Link>
                }
              />
              {didYouMeanSuggestions.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Did you mean:</p>
                  <ul className="flex flex-wrap gap-2 justify-center">
                    {didYouMeanSuggestions.map((pn) => (
                      <li key={pn}>
                        <Link
                          href={`/search?q=${encodeURIComponent(pn)}`}
                          className="inline-flex px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono text-accent-600 hover:border-accent-300 hover:bg-accent-50 transition"
                        >
                          {pn}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* No results after client-side condition filter */}
          {!loading && products.length > 0 && conditionParam && sortedProducts.length === 0 && (
            <EmptyState
              icon="📦"
              title="No products match this condition"
              description={`No results for condition "${conditionParam}". Try "Any condition" or broaden your search.`}
              action={
                <button type="button" onClick={() => navigate({ condition: null })} className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm">
                  Clear condition filter
                </button>
              }
            />
          )}

          {/* Results */}
          {!loading && products.length > 0 && !(conditionParam && sortedProducts.length === 0) && (
            <>
              <ProductGrid
                products={sortedProducts}
                productBasePath="/product"
              />

              {/* Compatible alternatives (when search returns part-number results) */}
              {alternatives.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Compatible Alternatives</h3>
                  <p className="text-sm text-gray-500 mb-4">Equivalent parts from other brands for &quot;{q}&quot;</p>
                  <ProductGrid
                    products={alternatives.slice(0, 8)}
                    productBasePath="/product"
                  />
                </div>
              )}

              <Pagination
                page={pageParam}
                totalPages={totalPages}
                onPageChange={(p) => navigate({ page: String(p) })}
                className="mt-8"
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  )
}
