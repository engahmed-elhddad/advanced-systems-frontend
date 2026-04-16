"use client"

import { apiFetch } from '@/lib/api'

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { ProductGrid } from "@/components/products/ProductGrid"
import {
  FilterChip,
  Pagination,
  ProductGridSkeleton,
  EmptyState,
  Spinner,
  CategoryCard,
} from "@/components/ui"
import { trackCategoryView } from "@/lib/analytics"

/** Map `attr.*` URL params to backend `spec=key:value` (repeatable). */
function appendSpecParamsFromUrl(target: URLSearchParams, searchParams: URLSearchParams) {
  for (const [k, v] of searchParams.entries()) {
    if (!k.startsWith("attr.") || !v) continue
    const specKey = k.slice(5)
    const trimmed = v.trim()
    if (!trimmed) continue
    // Comma-separated enum values (avoid splitting numeric ranges "min:max")
    if (trimmed.includes(",") && !/^[\d.]+:[\d.]+$/.test(trimmed)) {
      for (const segment of trimmed.split(",").map((s) => s.trim()).filter(Boolean)) {
        target.append("spec", `${specKey}:${segment}`)
      }
      continue
    }
    target.append("spec", `${specKey}:${trimmed}`)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryData {
  id: number
  name: string
  slug: string
  description?: string
  depth?: number
  path?: string
  is_active?: boolean
  product_count?: number
  children?: CategoryData[]
}

interface FacetAttribute {
  key: string
  label: string
  data_type: "string" | "number" | "boolean" | "enum"
  unit?: string | null
  options?: Array<string | { value: string; count?: number }> // string | enum
  option_counts?: Record<string, number>
  min?: number | null  // number
  max?: number | null  // number
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

function Breadcrumbs({ path, name }: { path?: string; name: string }) {
  // path field format: "automation/plc/siemens-s7"
  const segments = path ? path.split("/").filter(Boolean) : []
  // Last segment is current page — build intermediate crumbs from the rest
  const crumbs = segments.slice(0, -1)

  return (
    <nav className="flex items-center gap-1 text-sm text-white/50 flex-wrap" aria-label="Breadcrumb">
      <Link href="/" className="transition-colors hover:text-orange-300">Home</Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/30" />
      <Link href="/categories" className="transition-colors hover:text-orange-300">Categories</Link>
      {crumbs.map((crumb, i) => {
        const href = "/categories/" + segments.slice(0, i + 1).join("/")
        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/30" />
            <Link href={href} className="transition-colors hover:text-orange-300 capitalize">
              {crumb.replace(/-/g, " ")}
            </Link>
          </React.Fragment>
        )
      })}
      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/30" />
      <span className="font-medium text-white">{name}</span>
    </nav>
  )
}

// ─── Sidebar filter widgets ───────────────────────────────────────────────────

function CheckboxList({
  attr,
  active,
  onToggle,
}: {
  attr: FacetAttribute
  active: string[]
  onToggle: (val: string) => void
}) {
  if (!attr.options?.length) return null
  const toOption = (opt: string | { value: string; count?: number }) =>
    typeof opt === "string"
      ? { value: opt, count: attr.option_counts?.[opt] }
      : { value: opt.value, count: opt.count ?? attr.option_counts?.[opt.value] }
  return (
    <div className="space-y-1.5">
      {attr.options.map((opt) => {
        const { value, count } = toOption(opt)
        const checked = active.includes(value)
        return (
          <label key={value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(value)}
              className="w-4 h-4 rounded border-white/25 bg-white/5 text-orange-500 focus:ring-orange-500/50"
            />
            <span className="text-sm text-white/80 group-hover:text-white flex items-center gap-1">
              <span>{value}{attr.unit ? ` ${attr.unit}` : ""}</span>
              {typeof count === "number" && (
                <span className="text-xs text-white/45">({count})</span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function NumberRange({
  attr,
  valueMin,
  valueMax,
  onChange,
}: {
  attr: FacetAttribute
  valueMin: string
  valueMax: string
  onChange: (min: string, max: string) => void
}) {
  const [localMin, setLocalMin] = useState(valueMin)
  const [localMax, setLocalMax] = useState(valueMax)

  // Sync when URL params change externally
  useEffect(() => { setLocalMin(valueMin) }, [valueMin])
  useEffect(() => { setLocalMax(valueMax) }, [valueMax])

  function commit() {
    onChange(localMin, localMax)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={attr.min != null ? String(attr.min) : "Min"}
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        />
        <span className="text-white/35 shrink-0">–</span>
        <input
          type="number"
          placeholder={attr.max != null ? String(attr.max) : "Max"}
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        />
        {attr.unit && <span className="text-xs text-white/45 shrink-0">{attr.unit}</span>}
      </div>
    </div>
  )
}

function BooleanToggle({
  attr,
  value,
  onChange,
}: {
  attr: FacetAttribute
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(value === "true" ? "" : "true")}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
          value === "true" ? "bg-orange-600" : "bg-white/20"
        }`}
        aria-pressed={value === "true"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            value === "true" ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-white/80">{value === "true" ? "Yes" : "Any"}</span>
    </div>
  )
}

function FacetSection({
  attr,
  params,
  navigate,
}: {
  attr: FacetAttribute
  params: URLSearchParams
  navigate: (updates: Record<string, string | null>) => void
}) {
  const key = `attr.${attr.key}`
  const currentValue = params.get(key) ?? ""

  function toggleOption(opt: string) {
    const current = currentValue ? currentValue.split(",") : []
    const next = current.includes(opt)
      ? current.filter((v) => v !== opt)
      : [...current, opt]
    navigate({ [key]: next.length ? next.join(",") : null, page: null })
  }

  function setRange(min: string, max: string) {
    const val = min || max ? `${min}:${max}` : null
    navigate({ [key]: val, page: null })
  }

  const activeMulti = currentValue ? currentValue.split(",") : []
  const [rangeMin, rangeMax] = currentValue.includes(":")
    ? currentValue.split(":")
    : ["", ""]

  return (
    <div className="border-b border-white/10 pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-white/45 uppercase tracking-wider">{attr.label}</h3>
        {currentValue && (
          <button
            type="button"
            onClick={() => navigate({ [key]: null, page: null })}
            className="text-xs text-orange-300/90 hover:text-orange-200"
          >
            Clear
          </button>
        )}
      </div>

      {(attr.data_type === "enum" || attr.data_type === "string") && (
        <CheckboxList attr={attr} active={activeMulti} onToggle={toggleOption} />
      )}
      {attr.data_type === "number" && (
        <NumberRange
          attr={attr}
          valueMin={rangeMin}
          valueMax={rangeMax}
          onChange={setRange}
        />
      )}
      {attr.data_type === "boolean" && (
        <BooleanToggle
          attr={attr}
          value={currentValue}
          onChange={(val) => navigate({ [key]: val || null, page: null })}
        />
      )}
    </div>
  )
}

// ─── Main page (inner — has access to search params) ─────────────────────────

function CategoryPageInner({ slugSegments }: { slugSegments: string[] }) {
  const categoryViewTracked = React.useRef<string | null>(null)
  const router = useRouter()
  const sp = useSearchParams()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchParams = useMemo(() => sp ?? new URLSearchParams(), [sp])

  // The last slug segment is used to identify the category
  const slug = slugSegments[slugSegments.length - 1]
  const pageParam = Number(searchParams.get("page")) || 1

  const [category, setCategory] = useState<CategoryData | null>(null)
  const [facets, setFacets] = useState<FacetAttribute[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [catLoading, setCatLoading] = useState(true)
  const [facetsLoading, setFacetsLoading] = useState(true)
  const [prodLoading, setProdLoading] = useState(true)
  const [categoryFetchError, setCategoryFetchError] = useState(false)
  const [productsFetchError, setProductsFetchError] = useState(false)
  const [categoryRetryKey, setCategoryRetryKey] = useState(0)
  const [productsRetryKey, setProductsRetryKey] = useState(0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const API = API_BASE_URL
  const LIMIT = 30

  /** Facet filters need Meilisearch/spec path; plain category browse uses relational `GET /products`. */
  const hasFacetFilters = useMemo(() => {
    for (const [k, v] of searchParams.entries()) {
      if (k.startsWith("attr.") && String(v ?? "").trim()) return true
    }
    return false
  }, [searchParams])

  // ── navigate helper (same pattern as search page) ──────────────────────────
  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v != null) params.set(k, v)
        else params.delete(k)
      }
      router.push(`/categories/${slugSegments.join("/")}?${params.toString()}`)
    },
    [router, searchParams, slugSegments]
  )

  // ── Fetch category + facets (once per slug) ────────────────────────────────
  useEffect(() => {
    setCatLoading(true)
    setFacetsLoading(true)
    setCategoryFetchError(false)
    const abortController = new AbortController()
    ;(async () => {
      try {
        const [catRes, facetRes] = await Promise.all([
          apiFetch(`${API}/api/v1/categories/${slug}`, { signal: abortController.signal }),
          apiFetch(`${API}/api/v1/categories/${slug}/facets`, { signal: abortController.signal }),
        ])
        if (!catRes.ok) {
          setCategory(null)
          setFacets([])
          if (catRes.status !== 404) setCategoryFetchError(true)
          return
        }
        const catData = (await catRes.json()) as CategoryData
        setCategory(catData)
        if (facetRes.ok) {
          const facetData = (await facetRes.json()) as { attributes?: FacetAttribute[] }
          setFacets(facetData?.attributes ?? [])
        } else {
          setFacets([])
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        setCategory(null)
        setFacets([])
        setCategoryFetchError(true)
      } finally {
        setCatLoading(false)
        setFacetsLoading(false)
      }
    })()
    return () => abortController.abort()
  }, [slug, API, categoryRetryKey]) // eslint-disable-line react-hooks/exhaustive-deps -- retry nonce

  React.useEffect(() => {
    if (!category?.id) return
    const mark = `${slugSegments.join("/")}:${category.id}`
    if (categoryViewTracked.current === mark) return
    categoryViewTracked.current = mark
    trackCategoryView({
      category_id: category.id,
      category_slug: slugSegments.join("/"),
      category_name: category.name,
    })
  }, [category, slugSegments])

  // ── Fetch products when any filter or page changes ────────────────────────
  useEffect(() => {
    if (!category) return
    setProdLoading(true)
    setProductsFetchError(false)
    const abortController = new AbortController()

    const runCatalog = () => {
      const params = new URLSearchParams({
        page: String(pageParam),
        size: String(LIMIT),
        sort: "newest",
        category_id: String(category.id),
      })
      return `${API}/api/v1/products/?${params.toString()}`
    }

    const runSearch = () => {
      const params = new URLSearchParams()
      params.set("category_id", String(category.id))
      params.set("limit", String(LIMIT))
      params.set("page", String(pageParam))
      params.set("sort", "newest")
      appendSpecParamsFromUrl(params, searchParams)
      return `${API}/api/v1/search/?${params.toString()}`
    }

    const requestUrl = hasFacetFilters ? runSearch() : runCatalog()

    apiFetch(requestUrl, { signal: abortController.signal })
      .then(async (r) => {
        if (!r.ok) {
          console.warn(
            "[category browse] request failed",
            r.status,
            requestUrl,
            hasFacetFilters ? "search" : "products"
          )
          setProductsFetchError(true)
          setProducts([])
          setTotalCount(0)
          setTotalPages(1)
          return null
        }
        return r.json() as Promise<Record<string, unknown>>
      })
      .then((data) => {
        if (!data) return
        const items = hasFacetFilters
          ? (data.hits ?? data.results ?? data.items ?? data.products ?? []) as unknown[]
          : (data.items ?? data.products ?? []) as unknown[]
        const total = Number(data.total ?? 0)
        setProductsFetchError(false)
        setProducts(items)
        setTotalCount(total)
        setTotalPages(Math.ceil(total / LIMIT) || 1)
        if (total === 0) {
          console.warn("[category browse] zero results", {
            categoryId: category.id,
            slug: category.slug,
            requestUrl,
            source: hasFacetFilters ? "search" : "products",
          })
        }
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return
        console.warn("[category browse] fetch error", error)
        setProductsFetchError(true)
        setProducts([])
        setTotalCount(0)
        setTotalPages(1)
      })
      .finally(() => setProdLoading(false))
    return () => abortController.abort()
  }, [category, searchParams, pageParam, API, hasFacetFilters, productsRetryKey]) // eslint-disable-line react-hooks/exhaustive-deps -- retry nonce

  // ── Active filter chips ────────────────────────────────────────────────────
  const activeFilters: { key: string; label: string; value: string; rawValue: string; isRange: boolean }[] = []
  for (const attr of facets) {
    const paramKey = `attr.${attr.key}`
    const val = searchParams.get(paramKey)
    if (!val) continue
    // number range
    if (attr.data_type === "number" && val.includes(":")) {
      const [min, max] = val.split(":")
      if (min || max) {
        const display = [min && `≥${min}`, max && `≤${max}`]
          .filter(Boolean)
          .join(" ")
        activeFilters.push({
          key: paramKey,
          label: attr.label,
          value: display + (attr.unit ? ` ${attr.unit}` : ""),
          rawValue: val,
          isRange: true,
        })
      }
    } else {
      // checkbox multi-value or boolean
      val.split(",").forEach((v) =>
        activeFilters.push({ key: paramKey, label: attr.label, value: v, rawValue: v, isRange: false })
      )
    }
  }

  const hasActiveFilters = activeFilters.length > 0

  function clearAll() {
    const params = new URLSearchParams()
    router.push(`/categories/${slugSegments.join("/")}?${params.toString()}`)
  }

  // ── Sidebar component (shared mobile/desktop) ──────────────────────────────
  function Sidebar() {
    return (
      <div className="space-y-4">
        {facetsLoading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 pb-3 border-b border-white/10">
                <div className="h-3 w-24 rounded bg-white/15" />
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-4/5 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}
        {facets.map((attr) => (
          <FacetSection
            key={attr.key}
            attr={attr}
            params={searchParams}
            navigate={navigate}
          />
        ))}
        {facets.length === 0 && !catLoading && !facetsLoading && (
          <p className="text-sm text-white/45">No filters available for this category.</p>
        )}
      </div>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (catLoading) {
    return (
      <div className="relative min-h-screen px-4 py-8">
        <div className="page-container mx-auto animate-pulse space-y-6">
          <div className="h-4 w-56 rounded bg-white/15" />
          <div className="h-8 w-80 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    )
  }

  if (categoryFetchError) {
    return (
      <div className="relative min-h-screen py-12">
        <div className="page-container">
          <EmptyState
            title="Could not load this category"
            description="The catalog may be temporarily unavailable. Check your connection and try again."
            className="border-white/10 bg-white/5 backdrop-blur-xl [&_h2]:text-white [&_p]:text-white/60"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryRetryKey((k) => k + 1)}
                  className="rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:brightness-110"
                >
                  Try again
                </button>
                <Link
                  href="/categories"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
                >
                  Browse all categories
                </Link>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="relative min-h-screen py-12">
        <div className="page-container">
          <EmptyState
            title="Category not found"
            description="This category does not exist or has been removed."
            className="border-white/10 bg-white/5 backdrop-blur-xl [&_h2]:text-white [&_p]:text-white/60"
            action={
              <Link
                href="/categories"
                className="inline-block rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
              >
                View categories
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const subcategories = category.children?.filter((c) => c.is_active !== false) ?? []

  return (
    <div className="relative min-h-screen pb-16 pt-6 sm:pt-10">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[240px] w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-orange-500/12 blur-[100px]"
        aria-hidden
      />
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-white/[0.04] px-4 py-8 backdrop-blur-xl">
        <div className="page-container space-y-3">
          <Breadcrumbs path={category.path} name={category.name} />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{category.name}</h1>
              {category.description && (
                <p className="mt-1 max-w-2xl text-sm text-white/60 sm:text-base">{category.description}</p>
              )}
            </div>
            {totalCount > 0 && (
              <span className="mt-2 shrink-0 text-sm text-white/50">
                {totalCount.toLocaleString()} part{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="page-container relative z-10 px-4 py-8">
        {/* ── Subcategory cards (depth < 2 only) ─────────────────────────── */}
        {subcategories.length > 0 && (category.depth ?? 0) < 2 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">
              Subcategories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subcategories.map((sub) => (
                <CategoryCard
                  key={sub.id}
                  name={sub.name}
                  slug={`${slugSegments.join("/")}/${sub.slug}`}
                  product_count={sub.product_count}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Filters + products ──────────────────────────────────────────── */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          {facets.length > 0 && (
            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="sticky top-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Filters</h2>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-orange-300/90 hover:text-orange-200"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <Sidebar />
              </div>
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            {facets.length > 0 && (
              <div className="lg:hidden flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-orange-300/90 hover:text-orange-200"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilters.map(({ key, label, value, rawValue, isRange }) => (
                  <FilterChip
                    key={`${key}-${rawValue}`}
                    label={label}
                    value={value}
                    onRemove={() => {
                      const current = searchParams.get(key) ?? ""
                      if (isRange) {
                        navigate({ [key]: null, page: null })
                        return
                      }
                      const remaining = current
                        .split(",")
                        .filter((v) => v !== rawValue)
                      navigate({ [key]: !remaining.length ? null : remaining.join(","), page: null })
                    }}
                  />
                ))}
              </div>
            )}

            {/* Products */}
            {prodLoading ? (
              <ProductGridSkeleton />
            ) : productsFetchError ? (
              <div
                className="rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-10 text-center backdrop-blur-xl"
                role="alert"
              >
                <h2 className="text-lg font-semibold text-white">Could not load products</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
                  Something went wrong while loading the catalog for this category. Your filters are still here — try again,
                  or use search.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProductsRetryKey((k) => k + 1)}
                    className="rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:brightness-110"
                  >
                    Retry
                  </button>
                  <Link
                    href="/search"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
                  >
                    Smart search
                  </Link>
                </div>
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="No products in this category"
                description={
                  hasActiveFilters
                    ? "No parts match these filters. Try removing a filter or clearing all."
                    : subcategories.length > 0
                      ? `No parts are listed directly under ${category.name} — open a subcategory above, or browse the full catalog.`
                      : `No products listed under ${category.name} yet. Try search or request a quote for a specific part number.`
                }
                className="border-white/10 bg-white/5 backdrop-blur-xl [&_h2]:text-white [&_p]:text-white/60"
                action={
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
                      >
                        Clear filters
                      </button>
                    ) : null}
                    {slugSegments.length > 1 ? (
                      <Link
                        href={`/categories/${slugSegments.slice(0, -1).join("/")}`}
                        className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
                      >
                        Parent category
                      </Link>
                    ) : null}
                    <Link
                      href="/search"
                      className="rounded-xl border border-orange-400/35 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-100 transition-all hover:bg-orange-500/20"
                    >
                      Search catalog
                    </Link>
                    <Link
                      href="/products"
                      className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-orange-400/35 hover:bg-orange-500/10"
                    >
                      Browse all products
                    </Link>
                  </div>
                }
              />
            ) : (
              <>
                <ProductGrid products={products} productBasePath="/products" columns="compact" />
                <Pagination
                  page={pageParam}
                  totalPages={totalPages}
                  onPageChange={(p) => navigate({ page: String(p) })}
                  className="mt-8"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ────────────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-full flex-col border-l border-white/10 bg-[#121f3d]/98 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="font-semibold text-white">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-white/50 transition-colors hover:text-white"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Sidebar />
            </div>
            <div className="flex gap-3 border-t border-white/10 p-4">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { clearAll(); setMobileFiltersOpen(false) }}
                  className="btn-secondary flex-1 text-sm"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary flex-1 text-sm"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Entry point: unwrap the slug param and wrap in Suspense ─────────────────

export default function CategoryPage({
  params,
}: {
  params: { slug: string[] }
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-white/50">
          <Spinner size="lg" />
        </div>
      }
    >
      <CategoryPageInner slugSegments={params.slug} />
    </Suspense>
  )
}
