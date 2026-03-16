'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Building2, FolderTree } from 'lucide-react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface SearchSuggestion {
  part_number: string
  brand?: string
  category?: string
}

interface BrandItem {
  name: string
  slug: string
}

interface CategoryItem {
  name: string
  slug: string
}

export interface SearchBarProps {
  /** Visual variant: hero = large with glow, header = compact */
  variant?: 'hero' | 'header'
  /** Placeholder text for the input */
  placeholder?: string
  /** Visual size (deprecated: use variant instead; lg = hero, sm = header) */
  size?: 'sm' | 'lg'
  /** Wrapper className */
  className?: string
  /** Enable autocomplete suggestions (fetched from API) */
  showSuggestions?: boolean
  /** Debounce ms for autocomplete request (default 300) */
  debounceMs?: number
  /** Min query length before fetching suggestions (default 2) */
  minLength?: number
  /** Max suggestions to show per section (default 5 products, 4 brands, 4 categories) */
  suggestionLimit?: number
  /** Search results path (default /search) */
  searchPath?: string
  /** Product detail path (default /part-number) */
  productPath?: string
  /** Brand page path (default /brand) */
  brandPath?: string
  /** Category page path (default /category) */
  categoryPath?: string
}

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function parseSuggestions(data: unknown): SearchSuggestion[] {
  const raw = (data as { suggestions?: unknown[] })?.suggestions
    ?? (data as { results?: unknown[] })?.results
    ?? (data as { hits?: unknown[] })?.hits
    ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .map((r: unknown): SearchSuggestion | null => {
      if (typeof r === 'string')
        return { part_number: r }
      const o = r as Record<string, unknown>
      const pn = String(o.part_number ?? o.partNumber ?? '')
      if (!pn) return null
      const brand = o.brand
      const category = o.category
      return {
        part_number: pn,
        brand: typeof brand === 'string' ? brand : (brand && typeof brand === 'object' && 'name' in brand ? String((brand as { name?: string }).name ?? '') : undefined),
        category: typeof category === 'string' ? category : (category && typeof category === 'object' && 'name' in category ? String((category as { name?: string }).name ?? '') : undefined),
      }
    })
    .filter((s): s is SearchSuggestion => s !== null && !!s.part_number)
}

function normalizeBrands(data: unknown): BrandItem[] {
  const mapOne = (b: string | { name?: string; slug?: string }): BrandItem => {
    if (typeof b === 'string') return { name: b, slug: slugFromName(b) }
    const name = String(b.name ?? '')
    return { name, slug: (b as { slug?: string }).slug ?? slugFromName(name) }
  }
  if (Array.isArray(data)) return (data as (string | { name?: string; slug?: string })[]).map(mapOne)
  const list = (data as { brands?: (string | { name?: string; slug?: string })[] })?.brands
  return Array.isArray(list) ? list.map(mapOne) : []
}

function normalizeCategories(data: unknown): CategoryItem[] {
  const mapOne = (c: string | { name?: string; slug?: string }): CategoryItem => {
    if (typeof c === 'string') return { name: c, slug: slugFromName(c) }
    const name = String(c.name ?? '')
    return { name, slug: (c as { slug?: string }).slug ?? slugFromName(name) }
  }
  if (Array.isArray(data)) return (data as (string | { name?: string; slug?: string })[]).map(mapOne)
  const list = (data as { categories?: (string | { name?: string; slug?: string })[] })?.categories
  return Array.isArray(list) ? list.map(mapOne) : []
}

type SuggestionOption =
  | { type: 'product'; part_number: string; brand?: string; category?: string }
  | { type: 'brand'; name: string; slug: string }
  | { type: 'category'; name: string; slug: string }
  | { type: 'viewAll' }

export function SearchBar({
  variant: variantProp,
  placeholder = 'Search by part number, brand, or category',
  size = 'sm',
  className = '',
  showSuggestions = true,
  debounceMs = 300,
  minLength = 2,
  suggestionLimit = 8,
  searchPath = '/search',
  productPath = '/part-number',
  brandPath = '/brand',
  categoryPath = '/category',
}: SearchBarProps) {
  const variant = variantProp ?? (size === 'lg' ? 'hero' : 'header')
  const isHero = variant === 'hero'
  const [query, setQuery] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<SearchSuggestion[]>([])
  const [allBrands, setAllBrands] = useState<BrandItem[]>([])
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // ——— Load brands and categories once
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_BASE}/brands`).then((r) => r.json()),
      fetch(`${API_BASE}/categories`).then((r) => r.json()),
    ]).then(([brandData, catData]) => {
      if (!cancelled) {
        setAllBrands(normalizeBrands(brandData))
        setAllCategories(normalizeCategories(catData))
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // ——— Autocomplete: fetch product suggestions when query changes (debounced)
  useEffect(() => {
    if (!showSuggestions || query.trim().length < minLength) {
      setProductSuggestions([])
      setDropdownOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/search/suggest?q=${encodeURIComponent(query.trim())}&limit=${Math.max(5, suggestionLimit)}`
        )
        const data = await res.json()
        setProductSuggestions(parseSuggestions(data))
        setDropdownOpen(true)
        setActiveIndex(-1)
      } catch {
        setProductSuggestions([])
        setDropdownOpen(true)
        setActiveIndex(-1)
      }
    }, debounceMs)
    return () => clearTimeout(debounceRef.current)
  }, [query, showSuggestions, debounceMs, minLength, suggestionLimit])

  const q = query.trim().toLowerCase()
  const filteredBrands = q.length >= minLength
    ? allBrands.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)).slice(0, 4)
    : []
  const filteredCategories = q.length >= minLength
    ? allCategories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)).slice(0, 4)
    : []

  const productOptions = productSuggestions.slice(0, 5).map((s) => ({ type: 'product' as const, part_number: s.part_number, brand: s.brand, category: s.category }))
  const brandOptions = filteredBrands.map((b) => ({ type: 'brand' as const, name: b.name, slug: b.slug }))
  const categoryOptions = filteredCategories.map((c) => ({ type: 'category' as const, name: c.name, slug: c.slug }))
  const hasViewAll = query.trim().length >= minLength
  const options: SuggestionOption[] = [
    ...productOptions,
    ...brandOptions,
    ...categoryOptions,
    ...(hasViewAll ? [{ type: 'viewAll' as const }] : []),
  ]

  // ——— Enter to search: form submit navigates to search results
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (q) {
        setDropdownOpen(false)
        router.push(`${searchPath}?q=${encodeURIComponent(q)}`)
      }
    },
    [query, router, searchPath]
  )

  const navigateToSearch = useCallback(() => {
    const q = query.trim()
    if (q) {
      setDropdownOpen(false)
      router.push(`${searchPath}?q=${encodeURIComponent(q)}`)
    }
  }, [query, router, searchPath])

  const selectOption = useCallback(
    (opt: SuggestionOption) => {
      setDropdownOpen(false)
      setQuery('')
      if (opt.type === 'product') {
        router.push(`${productPath}/${encodeURIComponent(opt.part_number)}`)
      } else if (opt.type === 'brand') {
        router.push(`${brandPath}/${encodeURIComponent(opt.slug)}`)
      } else if (opt.type === 'category') {
        router.push(`${categoryPath}/${encodeURIComponent(opt.slug)}`)
      } else {
        navigateToSearch()
      }
    },
    [router, productPath, brandPath, categoryPath, navigateToSearch]
  )

  const totalOptions = options.length

  // ——— Keyboard: Arrow keys + Enter (select option) + Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!dropdownOpen) {
        if (e.key === 'Escape') setDropdownOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i < totalOptions - 1 ? i + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : totalOptions - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < totalOptions) {
          selectOption(options[activeIndex])
        } else {
          navigateToSearch()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setDropdownOpen(false)
        setActiveIndex(-1)
      }
    },
    [dropdownOpen, activeIndex, totalOptions, options, selectOption, navigateToSearch]
  )

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const showDropdown = showSuggestions && dropdownOpen && (options.length > 0 || query.trim().length >= minLength)

  return (
    <div className={`relative ${className}`} role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox">
      <form onSubmit={handleSubmit} role="search">
        <div
          className={`
            flex items-center bg-white rounded-xl border-2 border-gray-200
            transition-all duration-200
            focus-within:border-accent-500 focus-within:ring-0
            ${isHero
              ? 'h-14 min-h-[56px] px-4 shadow-xl shadow-accent-200/30 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] hover:border-gray-300'
              : 'h-10 min-h-[40px] px-2 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] hover:border-gray-300'
            }
          `}
        >
          <Search className={`text-gray-400 shrink-0 self-center ${isHero ? 'w-6 h-6 ml-1' : 'w-5 h-5 ml-2'}`} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= minLength && setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            className={`
              flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400 min-w-0
              ${isHero ? 'pl-3 pr-4 text-base md:text-lg h-full' : 'pl-2 pr-3 text-sm h-full'}
            `}
          />
          <button
            type="submit"
            className={`
              shrink-0 font-semibold text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors self-center
              ${isHero ? 'px-6 py-2.5 text-base' : 'px-4 py-1.5 text-sm'}
            `}
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions dropdown: Products | Brands | Categories | View all — industrial search */}
      {showDropdown && (
        <div
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 ring-1 ring-gray-900/5 z-50 overflow-hidden max-h-[28rem] overflow-y-auto"
        >
          {productOptions.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Part Numbers
              </div>
              {productOptions.map((opt, idx) => {
                const i = idx
                const isActive = activeIndex === i
                return (
                  <Link
                    key={`product-${opt.part_number}-${i}`}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={isActive}
                    href={`${productPath}/${encodeURIComponent(opt.part_number)}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-accent-50' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Package className="w-4 h-4 text-accent-500 shrink-0" aria-hidden />
                    <span className="font-mono text-sm font-semibold text-accent-600">{opt.part_number}</span>
                    {opt.brand && <span className="text-xs text-gray-500 truncate">{opt.brand}</span>}
                    {opt.category && <span className="text-xs text-gray-400 truncate">{opt.category}</span>}
                  </Link>
                )
              })}
            </>
          )}
          {brandOptions.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Brands
              </div>
              {brandOptions.map((opt, idx) => {
                const i = productOptions.length + idx
                const isActive = activeIndex === i
                return (
                  <Link
                    key={`brand-${opt.slug}-${i}`}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={isActive}
                    href={`${brandPath}/${encodeURIComponent(opt.slug)}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-accent-50' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Building2 className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                    <span className="text-sm font-medium text-gray-800">{opt.name}</span>
                    <span className="text-xs text-gray-400">Brand</span>
                  </Link>
                )
              })}
            </>
          )}
          {categoryOptions.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categories
              </div>
              {categoryOptions.map((opt, idx) => {
                const i = productOptions.length + brandOptions.length + idx
                const isActive = activeIndex === i
                return (
                  <Link
                    key={`category-${opt.slug}-${i}`}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={isActive}
                    href={`${categoryPath}/${encodeURIComponent(opt.slug)}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-accent-50' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FolderTree className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                    <span className="text-sm font-medium text-gray-800">{opt.name}</span>
                    <span className="text-xs text-gray-400">Category</span>
                  </Link>
                )
              })}
            </>
          )}
          {hasViewAll && (
            <Link
              key="view-all"
              id={`suggestion-${options.length - 1}`}
              role="option"
              aria-selected={activeIndex === options.length - 1}
              href={`${searchPath}?q=${encodeURIComponent(query.trim())}`}
              className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-t-2 border-gray-200 font-medium text-accent-600 hover:bg-accent-50/50 transition-colors"
              onMouseEnter={() => setActiveIndex(options.length - 1)}
              onClick={() => setDropdownOpen(false)}
            >
              <Search className="w-4 h-4 shrink-0" aria-hidden />
              View all results for &quot;{query.trim()}&quot;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
