"use client"

import { apiFetch } from '@/lib/api'

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { API_BASE_URL, normalizeCategoryQueryForApi } from "@/app/lib/constants"
import { ProductGrid } from "@/components/products/ProductGrid"
import {
  FilterChip,
  Pagination,
  ProductGridSkeleton,
  EmptyState,
  Spinner,
  CategoryCard,
} from "@/components/ui"

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
    <nav className="flex items-center gap-1 text-sm text-gray-500 flex-wrap" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
      <Link href="/categories" className="hover:text-primary-600 transition-colors">Categories</Link>
      {crumbs.map((crumb, i) => {
        const href = "/categories/" + segments.slice(0, i + 1).join("/")
        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={href} className="hover:text-primary-600 transition-colors capitalize">
              {crumb.replace(/-/g, " ")}
            </Link>
          </React.Fragment>
        )
      })}
      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
      <span className="text-gray-900 font-medium">{name}</span>
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
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-1">
              <span>{value}{attr.unit ? ` ${attr.unit}` : ""}</span>
              {typeof count === "number" && (
                <span className="text-xs text-gray-500">({count})</span>
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
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-gray-400 shrink-0">–</span>
        <input
          type="number"
          placeholder={attr.max != null ? String(attr.max) : "Max"}
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {attr.unit && <span className="text-xs text-gray-500 shrink-0">{attr.unit}</span>}
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
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          value === "true" ? "bg-primary-600" : "bg-gray-200"
        }`}
        aria-pressed={value === "true"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            value === "true" ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{value === "true" ? "Yes" : "Any"}</span>
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
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{attr.label}</h3>
        {currentValue && (
          <button
            type="button"
            onClick={() => navigate({ [key]: null, page: null })}
            className="text-xs text-primary-600 hover:text-primary-700"
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const API = API_BASE_URL
  const LIMIT = 30

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
    const abortController = new AbortController()
    Promise.all([
      apiFetch(`${API}/api/v1/categories/${slug}`, { signal: abortController.signal }).then((r) => r.json()),
      apiFetch(`${API}/api/v1/categories/${slug}/facets`, { signal: abortController.signal }).then((r) => r.json()),
    ])
      .then(([catData, facetData]) => {
        setCategory(catData)
        setFacets(facetData?.attributes ?? [])
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return
      })
      .finally(() => {
        setCatLoading(false)
        setFacetsLoading(false)
      })
    return () => abortController.abort()
  }, [slug, API])

  // ── Fetch products when any filter or page changes ────────────────────────
  useEffect(() => {
    if (!category) return
    setProdLoading(true)
    const abortController = new AbortController()

    const params = new URLSearchParams()
    params.set("q", category.name)
    const categorySlug =
      (category.slug && String(category.slug).trim()) || normalizeCategoryQueryForApi(category.name)
    params.set("category", categorySlug)
    params.set("limit", String(LIMIT))
    params.set("page", String(pageParam))

    // Forward all attr.* params from URL
    for (const [k, v] of searchParams.entries()) {
      if (k.startsWith("attr.") && v) params.set(k, v)
    }

    apiFetch(`${API}/api/v1/search/?${params.toString()}`, { signal: abortController.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = data.hits ?? data.results ?? data.items ?? data.products ?? []
        const total = data.total ?? 0
        setProducts(items)
        setTotalCount(total)
        setTotalPages(Math.ceil(total / LIMIT) || 1)
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return
        setProducts([])
        setTotalPages(1)
      })
      .finally(() => setProdLoading(false))
    return () => abortController.abort()
  }, [category, searchParams, pageParam, API])

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
              <div key={i} className="space-y-2 pb-3 border-b border-gray-100">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 rounded" />
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
          <p className="text-sm text-gray-400">No filters available for this category.</p>
        )}
      </div>
    )
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (catLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-4 w-56 bg-gray-200 rounded" />
          <div className="h-8 w-80 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 border border-gray-200" />
            ))}
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <EmptyState title="Category not found" description="This category does not exist or has been removed." />
      </div>
    )
  }

  const subcategories = category.children?.filter((c) => c.is_active !== false) ?? []

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <Breadcrumbs path={category.path} name={category.name} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="mt-1 text-gray-600 max-w-2xl">{category.description}</p>
              )}
            </div>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500 shrink-0 mt-2">
                {totalCount.toLocaleString()} part{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Subcategory cards (depth < 2 only) ─────────────────────────── */}
        {subcategories.length > 0 && (category.depth ?? 0) < 2 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-primary-600 hover:text-primary-700"
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
                    <span className="ml-1 rounded-full bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
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
            ) : products.length === 0 ? (
              <EmptyState
                title="No products found"
                description={
                  hasActiveFilters
                    ? "Try removing some filters."
                    : `No products listed under ${category.name} yet.`
                }
              />
            ) : (
              <>
                <ProductGrid products={products} productBasePath="/part-number" columns="compact" />
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
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Sidebar />
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <CategoryPageInner slugSegments={params.slug} />
    </Suspense>
  )
}
