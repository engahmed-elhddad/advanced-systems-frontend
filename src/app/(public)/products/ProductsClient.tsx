'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, LayoutGrid, List, Zap, MessageCircle, Plus, Check } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useSearch } from '@/hooks/useSearch'
import { useBrands } from '@/hooks/useBrands'
import { useCategories } from '@/hooks/useCategories'
import { useUIStore } from '@/state/uiStore'
import { useRFQListStore } from '@/state/rfqListStore'
import { ProductCard } from '@/components/products/ProductCard'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { productToCardProps } from '@/lib/productMappers'
import type { Product } from '@/types/product'
import { normalizeCategoryQueryForApi } from '@/app/lib/constants'

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-[2px] border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="aspect-square bg-[#F9FAFB]">
        <Skeleton variant="rect" className="w-full h-full !rounded-none" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton width="45%" height={10} />
        <Skeleton width="75%" height={16} />
        <Skeleton width="55%" height={10} />
        <div className="pt-3 mt-2 border-t border-[#E5E7EB]">
          <Skeleton height={34} className="w-full" />
        </div>
      </div>
    </div>
  )
}

export function ProductsClient() {
  const sp = useSearchParams()
  const currentParams = useMemo(() => sp ?? new URLSearchParams(), [sp])
  const router = useRouter()

  const page = Number(currentParams.get('page') || '1')
  const q = currentParams.get('q') || ''
  const brand = currentParams.get('brand') || ''
  const categoryParam = (currentParams.get('category') || '').trim()
  const category = categoryParam ? normalizeCategoryQueryForApi(categoryParam) : ''
  const sort = currentParams.get('sort') || ''

  const [searchInput, setSearchInput] = useState(q)
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)
  const openRFQModal = useUIStore((s) => s.openRFQModal)
  const addItem = useRFQListStore((s) => s.addItem)
  const rfqListItems = useRFQListStore((s) => s.items)

  const hasQuery = q.trim().length >= 2

  const productsResult = useProducts({
    page,
    size: 24,
    brand: brand || undefined,
    category: category || undefined,
    sort: sort || undefined,
  })

  const searchResult = useSearch({
    q,
    page,
    size: 24,
    brand: brand || undefined,
    category: category || undefined,
    sort: sort || undefined,
  })

  const products = hasQuery ? searchResult.hits : productsResult.products
  const total = hasQuery ? searchResult.total : productsResult.total
  const pages = hasQuery ? Math.ceil(searchResult.total / 24) || 1 : productsResult.pages
  const isLoading = hasQuery ? searchResult.isLoading : productsResult.isLoading
  const isError = hasQuery ? searchResult.isError : productsResult.isError

  const mainEmpty = !isLoading && !isError && products.length === 0
  const similarPrefix = useMemo(() => {
    if (!mainEmpty || !hasQuery) return ''
    const cleaned = q.replace(/[-_\s]/g, '').slice(0, 6)
    return cleaned.length >= 3 ? q.slice(0, Math.min(q.length - 2, 8)) : ''
  }, [mainEmpty, hasQuery, q])

  const similarResult = useSearch({
    q: similarPrefix,
    page: 1,
    size: 4,
  })
  const similarProducts = similarPrefix ? similarResult.hits : []

  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()

  const brandOptions = [
    { value: '', label: 'All Brands' },
    ...(brandsQuery.data ?? []).map((b) => ({ value: b.name, label: b.name })),
  ]
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categoriesQuery.data ?? []).map((c) => ({
      value: (c.slug && String(c.slug).trim()) ? String(c.slug).trim().toLowerCase() : normalizeCategoryQueryForApi(c.name),
      label: c.name,
    })),
  ]

  const categoryFilterLabel =
    category && categoriesQuery.data
      ? categoriesQuery.data.find((c) => (c.slug || '').toLowerCase() === category.toLowerCase())?.name ?? category
      : category

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(currentParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.set('page', '1')
      router.push(`/products?${params.toString()}`)
    },
    [currentParams, router],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        updateParam('q', searchInput.trim())
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    if (!categoryParam) return
    const normalized = normalizeCategoryQueryForApi(categoryParam)
    if (normalized && normalized !== categoryParam) {
      const params = new URLSearchParams(currentParams.toString())
      params.set('category', normalized)
      router.replace(`/products?${params.toString()}`)
    }
  }, [categoryParam, currentParams, router])

  const tableColumns = [
    {
      key: 'part_number',
      header: 'Part Number',
      render: (row: Product) => (
        <Link
          href={`/products/${encodeURIComponent(row.part_number)}`}
          className="font-mono text-[#0072CE] font-semibold hover:underline"
        >
          {row.part_number}
        </Link>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (row: Product) => (
        <span className="text-sm text-[#1A1A1A]">{row.brand ?? '—'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: Product) => (
        <span className="text-sm text-[#6B7280]">{row.category ?? '—'}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-[280px]',
      render: (row: Product) => (
        <span className="text-sm text-[#6B7280] truncate block max-w-[280px]">{row.description ?? '—'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      className: 'text-right',
      render: (row: Product) => (
        <span className="text-sm text-right block font-medium">
          {(row.price ?? row.price_usd) ? `$${Number(row.price ?? row.price_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Request Price'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row: Product) => {
        const inList = rfqListItems.some((i) => i.part_number === row.part_number)
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openRFQModal(row.part_number)
              }}
            >
              Get Price
            </Button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (!inList) addItem({ part_number: row.part_number, quantity: 1 })
              }}
              disabled={inList}
              className={`inline-flex items-center justify-center p-1.5 rounded-[2px] border transition-colors duration-150 ${
                inList
                  ? 'border-[#10B981]/30 bg-[#D1FAE5] text-[#065F46]'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#0072CE]/40 hover:text-[#0072CE]'
              }`}
              aria-label={inList ? `${row.part_number} in RFQ list` : `Add ${row.part_number} to list`}
            >
              {inList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        )
      },
    },
  ]

  const hasActiveFilters = Boolean(brand || category)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-b border-[#E5E7EB] pb-4 mb-6">
        <div className="flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by part number, brand, or keyword..."
            leftIcon={<Search className="w-4 h-4" />}
            aria-label="Search products"
          />
        </div>
        <div className="w-48">
          <Select
            options={brandOptions}
            value={brand}
            onChange={(v) => updateParam('brand', v)}
            placeholder="All Brands"
          />
        </div>
        <div className="w-48">
          <Select
            options={categoryOptions}
            value={category}
            onChange={(v) => updateParam('category', v)}
            placeholder="All Categories"
          />
        </div>
        <div className="flex gap-0.5 border border-[#E5E7EB] rounded-[2px] p-0.5 bg-[#F9FAFB]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`p-1.5 rounded-[2px] transition-colors duration-150 ${
              viewMode === 'grid'
                ? 'bg-white text-[#0072CE] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            className={`p-1.5 rounded-[2px] transition-colors duration-150 ${
              viewMode === 'table'
                ? 'bg-white text-[#0072CE] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results bar */}
      <div className="text-xs text-[#6B7280] mb-4 flex items-center gap-2 flex-wrap">
        {hasQuery ? (
          <span className="font-medium">{total} results for &ldquo;{q}&rdquo;</span>
        ) : (
          <span>Showing {total} products</span>
        )}
        {brand && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F4FD] border border-[#0072CE]/20 rounded-[2px] text-[#0072CE] text-xs font-medium transition-colors duration-150">
            Brand: {brand}
            <button
              type="button"
              onClick={() => updateParam('brand', '')}
              className="ml-0.5 hover:text-[#005BA4] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0072CE]"
              aria-label="Remove brand filter"
            >
              &times;
            </button>
          </span>
        )}
        {category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F4FD] border border-[#0072CE]/20 rounded-[2px] text-[#0072CE] text-xs font-medium transition-colors duration-150">
            Category: {categoryFilterLabel}
            <button
              type="button"
              onClick={() => updateParam('category', '')}
              className="ml-0.5 hover:text-[#005BA4] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0072CE]"
              aria-label="Remove category filter"
            >
              &times;
            </button>
          </span>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="text-[#0072CE] hover:text-[#005BA4] text-xs font-medium underline-offset-2 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0072CE] rounded-[2px]"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <DataTable columns={tableColumns} data={[]} loading />
        )
      ) : isError ? (
        <div className="text-center py-16 bg-[#FEF3C7] rounded-[2px] border border-[#F59E0B]/30">
          <p className="text-lg font-semibold text-[#92400E]">Having trouble loading data</p>
          <p className="text-sm text-[#92400E]/80 mt-1">Please try again or contact us on WhatsApp.</p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <Button variant="primary" onClick={() => productsResult.refetch()}>
              Try again
            </Button>
            <a
              href={`https://wa.me/201000629229?text=${encodeURIComponent('Hello, I need help finding industrial parts')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-[#E5E7EB] rounded-[2px] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors duration-150"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      ) : products.length === 0 ? (
        hasQuery ? (
          <div className="animate-fadeIn">
            <div className="text-center py-16 bg-white rounded-[2px] border border-[#E5E7EB]">
              <div className="max-w-md mx-auto px-4">
                <p className="text-xs uppercase tracking-wider text-[#6B7280]">Searched Part Number</p>
                <p className="font-mono text-lg font-bold text-[#0072CE] tracking-tight mt-1">
                  {q}
                </p>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mt-3">
                  We don&rsquo;t have this part listed, but we can source it for you.
                </h3>
                <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                  Share your request and our sourcing team will send availability and pricing quickly.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => openRFQModal(q.trim())}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm shadow-sm transition-colors duration-150"
                  >
                    <Zap className="w-4 h-4" />
                    Get Price in 2 Hours
                  </button>
                  <a
                    href={`https://wa.me/201000629229?text=${encodeURIComponent(`I need pricing for ${q.trim()}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] font-medium text-sm hover:bg-[#F9FAFB] transition-colors duration-150"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    Message on WhatsApp
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateParam('q', '')
                  }}
                  className="mt-4 text-xs text-[#6B7280] hover:text-[#0072CE] transition-colors duration-150"
                >
                  or browse all products
                </button>
              </div>
            </div>

            {categoriesQuery.data && categoriesQuery.data.length > 0 && (
              <div className="mt-6 rounded-[2px] border border-[#E5E7EB] bg-white p-4 sm:p-5">
                <p className="text-sm font-semibold text-[#1A1A1A]">Browse similar categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoriesQuery.data.slice(0, 6).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() =>
                        updateParam(
                          'category',
                          (cat.slug && String(cat.slug).trim()) ? String(cat.slug).trim().toLowerCase() : normalizeCategoryQueryForApi(cat.name),
                        )
                      }
                      className="inline-flex items-center rounded-[2px] border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:border-[#0072CE]/40 hover:text-[#0072CE] transition-colors duration-150"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {similarProducts.length > 0 && (
              <div className="mt-8 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Similar parts you may consider</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {similarProducts.map((p, idx) => (
                    <div
                      key={p.part_number}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${150 + idx * 50}ms` }}
                    >
                      <ProductCard
                        {...productToCardProps(p)}
                        productBasePath="/products"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 text-[#6B7280] bg-[#F9FAFB] rounded-[2px] border border-[#E5E7EB]">
            <p className="text-lg font-medium text-[#1A1A1A]">No products match the selected filters</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => router.push('/products')}
            >
              Clear filters
            </Button>
          </div>
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, idx) => (
            <div
              key={p.part_number}
              className="animate-fadeIn"
              style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
            >
              <ProductCard
                {...productToCardProps(p)}
                productBasePath="/products"
              />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={tableColumns}
          data={products as (Product & Record<string, unknown>)[]}
          rowKey={(row) => row.part_number}
          stickyHeader
        />
      )}

      {/* Pagination */}
      {!hasQuery && pages > 1 && (
        <nav className="flex items-center justify-center gap-4 mt-8" aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateParam('page', String(page - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[#6B7280] tabular-nums">
            Page {page} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateParam('page', String(page + 1))}
            disabled={page >= pages}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
