'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SlidersHorizontal, Search, FileText, Package, GitCompare, X } from 'lucide-react'
import { API_BASE_URL, CATEGORIES } from '@/lib/constants'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Select } from '@/components/ui/Select'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { SELECT_EMPTY, sentinelToEmpty } from '@/lib/formSentinels'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL

// Common industrial values (used when API options are empty)
const DEFAULT_CURRENTS = ['6A', '9A', '12A', '16A', '20A', '25A', '32A', '40A', '63A']
const DEFAULT_VOLTAGES = ['24V', '230V', '400V', '230V AC', '400V AC', '24V DC']
const DEFAULT_POLES = ['1', '2', '3', '4']
const DEFAULT_MOUNTING = ['DIN rail', 'Panel', 'Flange', 'Screw', 'Snap-on']

interface Product {
  part_number: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  datasheet_url?: string
  specifications?: Record<string, unknown>
  current?: string
  voltage?: string
  poles?: string
  mounting_type?: string
}

export default function ProductFinderPage() {
  const [filters, setFilters] = useState({
    category: '',
    current: '',
    voltage: '',
    poles: '',
    mounting_type: '',
  })
  const debouncedFilters = useDebouncedValue(filters, 300)
  const [options, setOptions] = useState<{
    categories: string[]
    current: string[]
    voltage: string[]
    poles: string[]
    mounting_type: string[]
  }>({
    categories: [],
    current: [],
    voltage: [],
    poles: [],
    mounting_type: [],
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(true)

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/product-finder/options`)
      const data = await res.json()
      setOptions({
        categories: data.categories?.length ? data.categories : CATEGORIES.map(c => c.name),
        current: data.current?.length ? data.current : DEFAULT_CURRENTS,
        voltage: data.voltage?.length ? data.voltage : DEFAULT_VOLTAGES,
        poles: data.poles?.length ? data.poles : DEFAULT_POLES,
        mounting_type: data.mounting_type?.length ? data.mounting_type : DEFAULT_MOUNTING,
      })
    } catch {
      setOptions({
        categories: CATEGORIES.map(c => c.name),
        current: DEFAULT_CURRENTS,
        voltage: DEFAULT_VOLTAGES,
        poles: DEFAULT_POLES,
        mounting_type: DEFAULT_MOUNTING,
      })
    }
  }, [])

  useEffect(() => { fetchOptions() }, [fetchOptions])

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const f = debouncedFilters
      if (f.category) params.set('category', f.category)
      if (f.current) params.set('current', f.current)
      if (f.voltage) params.set('voltage', f.voltage)
      if (f.poles) params.set('poles', f.poles)
      if (f.mounting_type) params.set('mounting_type', f.mounting_type)
      params.set('page', String(page))
      params.set('limit', '24')
      const res = await fetch(`${API}/api/product-finder/search?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.pages ?? 1)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedFilters, page])

  const { category: fc, current: fcur, voltage: fv, poles: fp, mounting_type: fm } = filters
  useEffect(() => {
    setPage(1)
  }, [fc, fcur, fv, fp, fm])
  useEffect(() => { search() }, [search])

  const toggleCompare = (pn: string) => {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(pn)) next.delete(pn)
      else if (next.size < 5) next.add(pn)
      return next
    })
  }

  const imageUrl = (url: string | undefined) => {
    if (!url) return '/products/no-product-image.jpg'
    if (url.startsWith('http')) return url
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const compareProducts = products.filter(p => compareIds.has(p.part_number))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-14 px-4 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Smart Component Finder</h1>
          <p className="text-slate-300 text-lg">
            Search by specifications â€“ current, voltage, poles, mounting. No part number required.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside
            className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}
          >
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-2 -m-2 text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <Select
                  variant="light"
                  label="Category"
                  placeholder="All categories"
                  value={filters.category ? filters.category : SELECT_EMPTY}
                  onChange={(v) => setFilters((f) => ({ ...f, category: sentinelToEmpty(v) }))}
                  options={[
                    { value: SELECT_EMPTY, label: 'All categories' },
                    ...options.categories.map((c) => ({ value: c, label: c })),
                  ]}
                />
                <Select
                  variant="light"
                  label="Current"
                  placeholder="Any"
                  value={filters.current ? filters.current : SELECT_EMPTY}
                  onChange={(v) => setFilters((f) => ({ ...f, current: sentinelToEmpty(v) }))}
                  options={[
                    { value: SELECT_EMPTY, label: 'Any' },
                    ...options.current.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <Select
                  variant="light"
                  label="Voltage"
                  placeholder="Any"
                  value={filters.voltage ? filters.voltage : SELECT_EMPTY}
                  onChange={(v) => setFilters((f) => ({ ...f, voltage: sentinelToEmpty(v) }))}
                  options={[
                    { value: SELECT_EMPTY, label: 'Any' },
                    ...options.voltage.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <Select
                  variant="light"
                  label="Poles"
                  placeholder="Any"
                  value={filters.poles ? filters.poles : SELECT_EMPTY}
                  onChange={(v) => setFilters((f) => ({ ...f, poles: sentinelToEmpty(v) }))}
                  options={[
                    { value: SELECT_EMPTY, label: 'Any' },
                    ...options.poles.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <Select
                  variant="light"
                  label="Mounting Type"
                  placeholder="Any"
                  value={filters.mounting_type ? filters.mounting_type : SELECT_EMPTY}
                  onChange={(v) => setFilters((f) => ({ ...f, mounting_type: sentinelToEmpty(v) }))}
                  options={[
                    { value: SELECT_EMPTY, label: 'Any' },
                    ...options.mounting_type.map((v) => ({ value: v, label: v })),
                  ]}
                />
                <button
                  onClick={() => setFilters({ category: '', current: '', voltage: '', poles: '', mounting_type: '' })}
                  className="w-full py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {!showFilters && (
              <button
                onClick={() => setShowFilters(true)}
                className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Show filters
              </button>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
                    <div className="aspect-square bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or broadening the search criteria.
                </p>
                <button
                  onClick={() => setFilters({ category: '', current: '', voltage: '', poles: '', mounting_type: '' })}
                  className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div
                      key={p.part_number}
                      className={`group rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all ${compareIds.has(p.part_number) ? 'ring-2 ring-primary-500 border-primary-500' : 'border-slate-200'}`}
                    >
                      <Link
                        href={`/products/${encodeURIComponent(p.part_number)}`}
                        className="block relative aspect-square bg-slate-50"
                      >
                        {p.image_url ? (
                          <Image
                            src={imageUrl(p.image_url)}
                            alt={p.part_number}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-20 h-20 text-slate-300" />
                          </div>
                        )}
                        <button
                          onClick={e => { e.preventDefault(); toggleCompare(p.part_number) }}
                          className={`absolute top-2 right-2 p-2 rounded-lg ${compareIds.has(p.part_number) ? 'bg-primary-500 text-white' : 'bg-white/90 text-slate-600 hover:bg-slate-100'} shadow`}
                          title="Add to compare"
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      </Link>
                      <div className="p-4">
                        {p.manufacturer && (
                          <div className="mb-1">
                            <BrandLogo brand={p.manufacturer} variant="square" logoClassName="h-5 max-w-[80px]" badgeClassName="hidden" />
                          </div>
                        )}
                        <Link
                          href={`/products/${encodeURIComponent(p.part_number)}`}
                          className="font-mono font-semibold text-slate-900 hover:text-primary-600 block truncate"
                        >
                          {p.part_number}
                        </Link>
                        {p.category && <p className="text-sm text-slate-500 mt-0.5">{p.category}</p>}
                        {(p.current || p.voltage || p.poles) && (
                          <p className="text-xs text-slate-500 mt-1">
                            {[p.current, p.voltage, p.poles].filter(Boolean).join(' Â· ')}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/products/${encodeURIComponent(p.part_number)}`}
                            className="text-sm font-medium text-primary-600 hover:underline"
                          >
                            View product
                          </Link>
                          {p.datasheet_url && (
                            <a
                              href={p.datasheet_url.startsWith('http') ? p.datasheet_url : `${API}${p.datasheet_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600"
                            >
                              <FileText className="w-4 h-4" /> Datasheet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Comparison panel */}
        {compareProducts.length > 0 && (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Compare ({compareProducts.length} selected)
              </h2>
              <button
                onClick={() => setCompareIds(new Set())}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-700 w-32">Spec</th>
                    {compareProducts.map(p => (
                      <th key={p.part_number} className="text-left px-4 py-3 font-medium">
                        <Link href={`/products/${encodeURIComponent(p.part_number)}`} className="font-mono text-primary-600 hover:underline">
                          {p.part_number}
                        </Link>
                        <button onClick={() => toggleCompare(p.part_number)} className="ml-2 text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4 inline" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-500">Brand</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.manufacturer || 'â€”'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-500">Category</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.category || 'â€”'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-500">Current</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.current || 'â€”'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-500">Voltage</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.voltage || 'â€”'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="px-4 py-2 font-medium text-slate-500">Poles</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.poles || 'â€”'}</td>)}</tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-500">Mounting</td>{compareProducts.map(p => <td key={p.part_number} className="px-4 py-2">{p.mounting_type || 'â€”'}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex gap-3">
              {compareProducts.map(p => (
                <Link
                  key={p.part_number}
                  href={`/products/${encodeURIComponent(p.part_number)}`}
                  className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
                >
                  View {p.part_number}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
