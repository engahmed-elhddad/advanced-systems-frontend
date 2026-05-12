'use client'

import { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Package, Building2, FolderTree, Loader2, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/SafeImage'
import { HighlightMatch } from '@/components/search/SearchHighlight'
import { asApiDisplayString, cn } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/constants'
import { getProductByPartNumber } from '@/lib/api'

const API_BASE = API_BASE_URL

const RECENT_KEY = 'asi_search_recent'
const MAX_RECENT = 8

const POPULAR_SEARCHES = [
  '6ES7315-2AH14-0AB0',
  '6EP1333-2BA20',
  '3RT1015-1BB41',
  'S8VK-G24024',
  'ATV630',
  'Siemens PLC',
]

export interface SearchSuggestion {
  part_number: string
  name?: string
  brand?: string
  brand_name?: string
  category?: string
  /** Category label from autocomplete (Meili + DB follow-up, spec 011). */
  category_name?: string
  /** Canonical storefront image URL from search index. */
  image_url?: string
  /** @deprecated Use image_url; retained for older autocomplete payloads. */
  primary_image?: string
}

interface BrandItem {
  name: string
  slug: string
  logo_url?: string | null
}

interface CategoryItem {
  name: string
  slug: string
}

export interface SearchBarProps {
  variant?: 'hero' | 'header'
  placeholder?: string
  size?: 'sm' | 'lg'
  className?: string
  showSuggestions?: boolean
  debounceMs?: number
  minLength?: number
  suggestionLimit?: number
  searchPath?: string
  productPath?: string
  brandPath?: string
  categoryPath?: string
  /** Controlled input (URL-bound on search page). Omit for standalone (navbar / hero). */
  value?: string
  onValueChange?: (value: string) => void
}

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function readRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function pushRecent(term: string) {
  const t = term.trim()
  if (t.length < 1 || typeof window === 'undefined') return
  const prev = readRecent()
  const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

function normalizeBrandsV1(data: unknown): BrandItem[] {
  if (!Array.isArray(data)) return []
  return data.map((b: Record<string, unknown>) => {
    const name = String(b.name ?? '')
    return {
      name,
      slug: String(b.slug ?? slugFromName(name)),
      logo_url: (b.logo_url as string) || null,
    }
  })
}

function normalizeCategoriesV1(data: unknown): CategoryItem[] {
  if (!Array.isArray(data)) return []
  return data.map((c: Record<string, unknown>) => {
    const name = String(c.name ?? '')
    return {
      name,
      slug: String(c.slug ?? slugFromName(name)),
    }
  })
}

function parseMeiliHits(data: unknown, limit: number): SearchSuggestion[] {
  const raw =
    (data as { suggestions?: unknown[] })?.suggestions ??
    (data as { hits?: unknown[] })?.hits ??
    (data as { results?: unknown[] })?.results ??
    []
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, limit)
    .map((r: unknown): SearchSuggestion | null => {
      const o = r as Record<string, unknown>
      const pn = String(o.part_number ?? o.partNumber ?? '')
      if (!pn) return null
      const img =
        typeof o.image_url === 'string' && o.image_url.trim()
          ? o.image_url.trim()
          : typeof o.primary_image === 'string'
            ? o.primary_image
            : undefined
      return {
        part_number: pn,
        name:
          asApiDisplayString(o.name) ||
          (typeof o.name === 'number' ? String(o.name) : ''),
        brand: asApiDisplayString(o.brand_name ?? o.brand),
        brand_name: asApiDisplayString(o.brand_name),
        category: asApiDisplayString(o.category_name ?? o.category),
        category_name: asApiDisplayString(o.category_name),
        image_url: img,
        primary_image: img,
      }
    })
    .filter((s): s is SearchSuggestion => s !== null)
}

function parseLegacySuggest(data: unknown, limit: number): SearchSuggestion[] {
  const raw = (data as { suggestions?: unknown[] })?.suggestions ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, limit)
    .map((r: unknown): SearchSuggestion | null => {
      if (typeof r === 'string') return { part_number: r }
      const o = r as Record<string, unknown>
      const pn = String(o.part_number ?? '')
      if (!pn) return null
      return {
        part_number: pn,
        brand: asApiDisplayString(o.brand ?? o.brand_name) || undefined,
        category: asApiDisplayString(o.category ?? o.category_name) || undefined,
      }
    })
    .filter((s): s is SearchSuggestion => s !== null)
}

type SuggestionOption =
  | { type: 'product'; part_number: string; name: string; brand?: string; category?: string; image?: string }
  | { type: 'brand'; name: string; slug: string; logo_url?: string | null }
  | { type: 'category'; name: string; slug: string }
  | { type: 'recent'; text: string }
  | { type: 'popular'; text: string }
  | { type: 'viewAll' }

function SkeletonBlock() {
  return (
    <div className="space-y-2 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 max-w-[200px] rounded bg-white/10" />
            <div className="h-2.5 max-w-[120px] rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SearchBar({
  variant: variantProp,
  placeholder = 'Search parts, brands, or categories',
  size = 'sm',
  className = '',
  showSuggestions = true,
  debounceMs = 300,
  minLength = 1,
  suggestionLimit = 10,
  searchPath = '/search',
  productPath = '/products',
  brandPath = '/brands',
  categoryPath = '/categories',
  value: controlledValue,
  onValueChange,
}: SearchBarProps) {
  const reactId = useId()
  const listboxId = `search-smart-${reactId.replace(/:/g, '')}`
  const variant = variantProp ?? (size === 'lg' ? 'hero' : 'header')
  const isHero = variant === 'hero'

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const qParam = searchParams.get('q') ?? ''
  const [internalQuery, setInternalQuery] = useState(qParam)
  const isControlled = controlledValue !== undefined

  useEffect(() => {
    if (isControlled) return
    setInternalQuery(qParam)
  }, [qParam, isControlled])

  const query = isControlled ? controlledValue! : internalQuery
  const applyQuery = useCallback(
    (next: string) => {
      onValueChange?.(next)
      if (!isControlled) setInternalQuery(next)
    },
    [isControlled, onValueChange],
  )
  const [productSuggestions, setProductSuggestions] = useState<SearchSuggestion[]>([])
  const [allBrands, setAllBrands] = useState<BrandItem[]>([])
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fetching, setFetching] = useState(false)
  const manualCloseRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setRecent(readRecent())
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_BASE}/api/v1/brands/`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/v1/categories/`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([brandData, catData]) => {
        if (!cancelled) {
          setAllBrands(normalizeBrandsV1(brandData))
          setAllCategories(normalizeCategoriesV1(catData))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!showSuggestions) {
      setProductSuggestions([])
      setFetching(false)
      return
    }
    const q = query.trim()
    if (q.length < minLength) {
      setProductSuggestions([])
      setFetching(false)
      return
    }
    clearTimeout(debounceRef.current)
    setFetching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const lim = Math.min(20, Math.max(6, suggestionLimit))
        const v1 = await fetch(
          `${API_BASE}/api/v1/search/autocomplete?q=${encodeURIComponent(q)}&limit=${lim}`,
        )
        if (v1.ok) {
          const data = await v1.json()
          const parsed = parseMeiliHits(data, lim)
          if (parsed.length > 0) {
            setProductSuggestions(parsed)
            if (!manualCloseRef.current) setDropdownOpen(true)
            setActiveIndex(-1)
            setFetching(false)
            return
          }
        }
        const v1s = await fetch(
          `${API_BASE}/api/v1/search/suggest?q=${encodeURIComponent(q)}&limit=${lim}`,
        )
        if (v1s.ok) {
          const sdata = await v1s.json()
          const parsedS = parseLegacySuggest(sdata, lim)
          if (parsedS.length > 0) {
            setProductSuggestions(parsedS)
            if (!manualCloseRef.current) setDropdownOpen(true)
            setActiveIndex(-1)
            setFetching(false)
            return
          }
        }
        const leg = await fetch(`${API_BASE}/search/suggest?q=${encodeURIComponent(q)}&limit=${lim}`)
        const legData = leg.ok ? await leg.json() : { suggestions: [] }
        setProductSuggestions(parseLegacySuggest(legData, lim))
        if (!manualCloseRef.current) setDropdownOpen(true)
        setActiveIndex(-1)
      } catch {
        setProductSuggestions([])
        if (!manualCloseRef.current) setDropdownOpen(true)
        setActiveIndex(-1)
      } finally {
        setFetching(false)
      }
    }, debounceMs)
    return () => clearTimeout(debounceRef.current)
  }, [query, showSuggestions, debounceMs, minLength, suggestionLimit])

  const qLower = query.trim().toLowerCase()

  const { productOptions, brandOptions, categoryOptions, recentOpts, popularOpts, idleOptions, searchOptions } =
    useMemo(() => {
      const po = productSuggestions.slice(0, 10).map((s) => ({
        type: 'product' as const,
        part_number: s.part_number,
        name: s.name || s.part_number,
        brand: s.brand_name || s.brand,
        category: s.category_name || s.category,
        image: s.image_url ?? s.primary_image,
      }))
      const filteredBrands =
        qLower.length >= minLength
          ? allBrands
              .filter((b) => b.name.toLowerCase().includes(qLower) || b.slug.toLowerCase().includes(qLower))
              .slice(0, 8)
          : []
      const filteredCategories =
        qLower.length >= minLength
          ? allCategories
              .filter((c) => c.name.toLowerCase().includes(qLower) || c.slug.toLowerCase().includes(qLower))
              .slice(0, 8)
          : []
      const bo = filteredBrands.map((b) => ({
        type: 'brand' as const,
        name: b.name,
        slug: b.slug,
        logo_url: b.logo_url,
      }))
      const co = filteredCategories.map((c) => ({
        type: 'category' as const,
        name: c.name,
        slug: c.slug,
      }))
      const ro = recent.slice(0, 5).map((text) => ({ type: 'recent' as const, text }))
      const poPopular = POPULAR_SEARCHES.filter((p) => !recent.some((r) => r.toLowerCase() === p.toLowerCase()))
        .slice(0, 5)
        .map((text) => ({ type: 'popular' as const, text }))
      const idle: SuggestionOption[] = [...ro, ...poPopular]
      const hasViewAll = qLower.length >= minLength
      const search: SuggestionOption[] = [
        ...po,
        ...bo,
        ...co,
        ...(hasViewAll ? [{ type: 'viewAll' as const }] : []),
      ]
      return {
        productOptions: po,
        brandOptions: bo,
        categoryOptions: co,
        recentOpts: ro,
        popularOpts: poPopular,
        idleOptions: idle,
        searchOptions: search,
      }
    }, [minLength, allBrands, allCategories, productSuggestions, recent, qLower])

  const isIdlePanel = qLower.length < minLength
  const options: SuggestionOption[] = isIdlePanel ? idleOptions : searchOptions
  const hasResults =
    !isIdlePanel &&
    !fetching &&
    (productOptions.length > 0 || brandOptions.length > 0 || categoryOptions.length > 0)
  const isEmptySearch = !isIdlePanel && !fetching && !hasResults && qLower.length >= minLength

  const pushSearchWithQ = useCallback(
    (qv: string) => {
      manualCloseRef.current = true
      pushRecent(qv)
      setRecent(readRecent())
      setDropdownOpen(false)
      if (pathname === '/search') {
        const p = new URLSearchParams(searchParams.toString())
        p.set('q', qv)
        p.delete('page')
        const s = p.toString()
        router.push(s ? `/search?${s}` : '/search')
      } else {
        router.push(`${searchPath}?q=${encodeURIComponent(qv)}`)
      }
    },
    [pathname, router, searchParams, searchPath],
  )

  const navigateToSearch = useCallback(
    (qRaw?: string) => {
      const qv = (qRaw ?? query).trim()
      if (qv) pushSearchWithQ(qv)
    },
    [query, pushSearchWithQ],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setDropdownOpen(false)
      setActiveIndex(-1)
      const qv = query.trim()
      if (!qv) {
        inputRef.current?.focus()
        return
      }
      try {
        const product = await getProductByPartNumber(qv)
        const slug = (product as { slug?: string } | null | undefined)?.slug
        if (slug && typeof slug === 'string' && slug.length > 0) {
          pushRecent(qv)
          setRecent(readRecent())
          setDropdownOpen(false)
          applyQuery('')
          router.push(`${productPath}/${encodeURIComponent(slug)}`)
          return
        }
      } catch {
        /* fall through to search */
      }
      pushSearchWithQ(qv)
    },
    [query, pushSearchWithQ, router, productPath, applyQuery],
  )

  const selectOption = useCallback(
    (opt: SuggestionOption) => {
      if (opt.type === 'product') {
        manualCloseRef.current = true
        pushRecent(opt.part_number)
        setRecent(readRecent())
        setDropdownOpen(false)
        applyQuery('')
        router.push(`${productPath}/${encodeURIComponent(opt.part_number)}`)
      } else if (opt.type === 'brand') {
        manualCloseRef.current = true
        pushRecent(opt.name)
        setRecent(readRecent())
        setDropdownOpen(false)
        applyQuery('')
        router.push(`${brandPath}/${encodeURIComponent(opt.slug)}`)
      } else if (opt.type === 'category') {
        manualCloseRef.current = true
        pushRecent(opt.name)
        setRecent(readRecent())
        setDropdownOpen(false)
        applyQuery('')
        router.push(`${categoryPath}/${encodeURIComponent(opt.slug)}`)
      } else if (opt.type === 'recent' || opt.type === 'popular') {
        applyQuery(opt.text)
        navigateToSearch(opt.text)
      } else {
        navigateToSearch()
      }
    },
    [router, productPath, brandPath, categoryPath, navigateToSearch, applyQuery],
  )

  const totalOptions = options.length

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return
      if (!dropdownOpen) {
        if (e.key === 'ArrowDown' && options.length > 0) {
          e.preventDefault()
          setDropdownOpen(true)
          setActiveIndex(0)
        }
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
        if (activeIndex >= 0 && activeIndex < totalOptions) {
          e.preventDefault()
          selectOption(options[activeIndex])
          return
        }
        setDropdownOpen(false)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setDropdownOpen(false)
        setActiveIndex(-1)
      }
    },
    [showSuggestions, dropdownOpen, activeIndex, totalOptions, options, selectOption, navigateToSearch],
  )

  useEffect(() => {
    if (activeIndex < 0) return
    const el = document.getElementById(`${listboxId}-opt-${activeIndex}`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex, listboxId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setDropdownOpen(false)
      setActiveIndex(-1)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDropdownOpen(false)
      setActiveIndex(-1)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    setDropdownOpen(false)
    setActiveIndex(-1)
  }, [pathname])

  const showDropdown =
    showSuggestions &&
    dropdownOpen &&
    (options.length > 0 || fetching || isEmptySearch || (isIdlePanel && (recentOpts.length > 0 || popularOpts.length > 0)))

  const shellClass = cn(
    'relative z-[1] flex w-full items-center backdrop-blur-2xl transition-[box-shadow,border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
    isHero
      ? [
          'gap-4 rounded-[1.25rem] border border-white/[0.11] bg-white/[0.07]',
          'min-h-[4.75rem] px-5 py-2 sm:min-h-[5.125rem] sm:px-6 sm:py-2.5',
          'shadow-premium-lg hover:border-white/[0.14]',
          'focus-within:border-orange-300/40 focus-within:bg-white/[0.09] focus-within:shadow-focus-search',
          'focus-within:ring-0',
        ]
      : [
          'gap-3 rounded-full border border-white/[0.1] bg-white/[0.06]',
          'min-h-[3.5rem] pl-4 pr-1.5 md:min-h-[3.625rem] md:pl-5',
          'shadow-premium-md hover:border-white/[0.13]',
          'focus-within:border-orange-300/35 focus-within:bg-white/[0.08] focus-within:shadow-focus-search',
          'focus-within:ring-0',
        ],
  )

  const btnClass = cn(
    'shrink-0 rounded-full bg-gradient-to-b from-[#FF8A1A] via-[#FF7A00] to-[#E85D00] font-semibold tracking-tight text-white',
    'shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_8px_24px_-4px_rgba(255,106,0,0.45),0_2px_8px_rgba(0,0,0,0.2)]',
    'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'hover:from-[#FF942E] hover:via-[#FF8320] hover:to-[#F06500] hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_12px_36px_-4px_rgba(255,106,0,0.55)]',
    'active:scale-[0.98]',
    isHero
      ? 'min-h-[3rem] px-8 py-3 text-[0.9375rem] sm:min-h-[3.25rem] sm:px-10 sm:text-base'
      : 'min-h-[2.625rem] px-5 py-2 text-[0.8125rem] font-semibold md:min-h-[2.75rem] md:px-6 md:text-sm',
  )

  const flatQuery = query.trim()

  const viewAllHref = useMemo(() => {
    if (!flatQuery) return searchPath
    if (pathname === '/search') {
      const p = new URLSearchParams(searchParams.toString())
      p.set('q', flatQuery)
      p.delete('page')
      const s = p.toString()
      return s ? `/search?${s}` : '/search'
    }
    return `${searchPath}?q=${encodeURIComponent(flatQuery)}`
  }, [flatQuery, pathname, searchParams, searchPath])

  const suggestionRowClass = (tone: 'part' | 'brand' | 'cat' | 'neutral', isActive: boolean) =>
    cn(
      'flex cursor-pointer items-center gap-3 border-b border-white/[0.06] py-3 pl-2 pr-4 transition-all duration-200 last:border-b-0',
      'border-l-[3px]',
      tone === 'part' && 'border-l-orange-400/75',
      tone === 'brand' && 'border-l-amber-400/65',
      tone === 'cat' && 'border-l-violet-400/70',
      tone === 'neutral' && 'border-l-white/[0.08]',
      isActive
        ? 'bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,122,0,0.2)]'
        : 'hover:bg-white/[0.06]',
    )

  const renderOptionRow = (opt: SuggestionOption, index: number) => {
    const isActive = activeIndex === index

    if (opt.type === 'product') {
      return (
        <Link
          key={`p-${opt.part_number}-${index}`}
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          href={`${productPath}/${encodeURIComponent(opt.part_number)}`}
          className={suggestionRowClass('part', isActive)}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={(e) => {
            e.preventDefault()
            selectOption(opt)
          }}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
            <SafeImage src={opt.image} alt="" className="h-full w-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              <HighlightMatch text={opt.name} query={flatQuery} />
            </p>
            <p className="truncate font-mono text-xs text-orange-200/90">
              <HighlightMatch text={opt.part_number} query={flatQuery} />
            </p>
            {opt.brand ? (
              <p className="truncate text-[11px] text-white/45">
                <span className="text-white/35">Brand </span>
                <HighlightMatch text={opt.brand} query={flatQuery} />
              </p>
            ) : (
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-orange-200/40">Part · search index</p>
            )}
            {opt.category ? (
              <p className="truncate text-[11px] text-white/45">
                <span className="text-white/35">Category </span>
                <HighlightMatch text={opt.category} query={flatQuery} />
              </p>
            ) : null}
          </div>
          <Package className="h-4 w-4 shrink-0 text-orange-400/80" aria-hidden />
        </Link>
      )
    }
    if (opt.type === 'brand') {
      return (
        <Link
          key={`b-${opt.slug}-${index}`}
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          href={`${brandPath}/${encodeURIComponent(opt.slug)}`}
          className={cn(suggestionRowClass('brand', isActive), 'group')}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={(e) => {
            e.preventDefault()
            selectOption(opt)
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
            {opt.logo_url ? (
              <SafeImage
                src={opt.logo_url}
                alt=""
                className="max-h-8 max-w-[90%] object-contain grayscale transition-all group-hover:grayscale-0"
              />
            ) : (
              <Building2 className="h-5 w-5 text-amber-200/50" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              <HighlightMatch text={opt.name} query={flatQuery} />
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200/45">Brand · directory</p>
          </div>
          <Building2 className="h-4 w-4 shrink-0 text-amber-400/55" aria-hidden />
        </Link>
      )
    }
    if (opt.type === 'category') {
      return (
        <Link
          key={`c-${opt.slug}-${index}`}
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          href={`${categoryPath}/${encodeURIComponent(opt.slug)}`}
          className={suggestionRowClass('cat', isActive)}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={(e) => {
            e.preventDefault()
            selectOption(opt)
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-violet-500/10">
            <FolderTree className="h-5 w-5 text-violet-200/75" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              <HighlightMatch text={opt.name} query={flatQuery} />
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-violet-200/45">Category · browse</p>
          </div>
        </Link>
      )
    }
    if (opt.type === 'recent') {
      return (
        <button
          key={`r-${opt.text}-${index}`}
          type="button"
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          className={cn(suggestionRowClass('neutral', isActive), 'w-full text-left')}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => selectOption(opt)}
        >
          <Clock className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
          <span className="truncate text-sm text-white/90">{opt.text}</span>
        </button>
      )
    }
    if (opt.type === 'popular') {
      return (
        <button
          key={`pop-${opt.text}-${index}`}
          type="button"
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          className={cn(suggestionRowClass('neutral', isActive), 'w-full text-left')}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => selectOption(opt)}
        >
          <TrendingUp className="h-4 w-4 shrink-0 text-orange-400/80" aria-hidden />
          <span className="truncate font-mono text-sm text-white/90">{opt.text}</span>
        </button>
      )
    }
    if (opt.type === 'viewAll') {
      return (
        <Link
          key="view-all"
          id={`${listboxId}-opt-${index}`}
          role="option"
          aria-selected={isActive}
          href={viewAllHref}
          className={cn(
            'flex items-center gap-3 border-t border-white/10 bg-orange-500/[0.08] px-4 py-3.5 font-semibold text-orange-200 transition-colors hover:bg-orange-500/15',
            isActive && 'bg-orange-500/20 ring-1 ring-inset ring-orange-400/30',
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={(e) => {
            e.preventDefault()
            pushSearchWithQ(flatQuery)
          }}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          View all results for &quot;{flatQuery}&quot;
        </Link>
      )
    }
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative', isHero && 'mx-auto w-full max-w-3xl', className)}
      role="combobox"
      aria-expanded={showDropdown}
      aria-controls={listboxId}
      aria-haspopup="listbox"
    >
      {isHero ? (
        <>
          <div
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-90 blur-3xl glow-ambient-search"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-[1px] -z-10 rounded-[1.35rem] bg-gradient-to-r from-orange-400/25 via-white/10 to-violet-400/20 opacity-80 blur-xl"
            aria-hidden
          />
        </>
      ) : null}
      <form onSubmit={handleSubmit} role="search">
        <div className={shellClass}>
          <Search
            className={cn(
              'shrink-0 text-orange-200/95',
              isHero ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-[1.35rem] w-[1.35rem] md:h-6 md:w-6',
            )}
            strokeWidth={isHero ? 2 : 1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              manualCloseRef.current = false
              applyQuery(e.target.value)
              setActiveIndex(-1)
            }}
            onFocus={() => {
              manualCloseRef.current = false
              setDropdownOpen(true)
              setRecent(readRecent())
            }}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 220)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            className={cn(
              'min-h-0 min-w-0 flex-1 border-0 bg-transparent text-white outline-none placeholder:text-white/40',
              isHero
                ? 'py-2 text-lg font-medium tracking-[-0.01em] placeholder:font-normal sm:text-[1.125rem] sm:leading-snug'
                : 'py-2 text-[0.9375rem] font-medium tracking-[-0.015em] placeholder:font-normal md:text-[1rem]',
            )}
          />
          {fetching ? (
            <Loader2
              className={cn('shrink-0 animate-spin text-orange-200/80', isHero ? 'h-6 w-6' : 'h-5 w-5')}
              aria-label="Loading"
            />
          ) : null}
          <button type="submit" className={btnClass}>
            Search
          </button>
        </div>
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute left-0 right-0 z-[100] max-h-[min(70vh,440px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/[0.1] bg-[rgba(10,22,46,0.96)] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl',
            isHero ? 'top-[calc(100%+1rem)]' : 'top-[calc(100%+0.625rem)]',
          )}
        >
          {isIdlePanel && (recentOpts.length > 0 || popularOpts.length > 0) && (
            <>
              {recentOpts.length > 0 && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-white/[0.07] bg-[#0a162e]/95 px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45 backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5 text-white/35" aria-hidden />
                    Recent
                  </div>
                  {recentOpts.map((opt, i) => renderOptionRow(opt, i))}
                </>
              )}
              {popularOpts.length > 0 && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-white/[0.07] bg-[#0a162e]/95 px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45 backdrop-blur-md">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-300/75" aria-hidden />
                    Popular
                  </div>
                  {popularOpts.map((opt, i) => renderOptionRow(opt, recentOpts.length + i))}
                </>
              )}
            </>
          )}

          {qLower.length >= minLength && fetching && (
            <>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-300/80" aria-hidden />
                Searching…
              </div>
              <SkeletonBlock />
            </>
          )}

          {isEmptySearch && (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-3 text-sm font-medium text-white/70">No matches yet</p>
              <p className="mt-1 text-xs text-white/45">Try another keyword or browse brands and categories.</p>
              <button
                type="button"
                className="mt-5 text-sm font-semibold text-orange-300 hover:text-orange-200"
                onClick={() => navigateToSearch()}
              >
                Search anyway →
              </button>
            </div>
          )}

          {!isIdlePanel && !fetching && hasResults && (
            <>
              {productOptions.length > 0 && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-white/[0.07] bg-[#0a162e]/95 px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45 backdrop-blur-md">
                    <Package className="h-3.5 w-3.5 text-orange-300/80" aria-hidden />
                    Parts · search index
                  </div>
                  {productOptions.map((opt, idx) => {
                    const i = idx
                    return renderOptionRow(opt, i)
                  })}
                </>
              )}
              {brandOptions.length > 0 && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-white/[0.07] bg-[#0a162e]/95 px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45 backdrop-blur-md">
                    <Building2 className="h-3.5 w-3.5 text-amber-200/80" aria-hidden />
                    Brands · directory
                  </div>
                  {brandOptions.map((opt, idx) => {
                    const i = productOptions.length + idx
                    return renderOptionRow(opt, i)
                  })}
                </>
              )}
              {categoryOptions.length > 0 && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-white/[0.07] bg-[#0a162e]/95 px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white/45 backdrop-blur-md">
                    <FolderTree className="h-3.5 w-3.5 text-violet-200/75" aria-hidden />
                    Categories · browse
                  </div>
                  {categoryOptions.map((opt, idx) => {
                    const i = productOptions.length + brandOptions.length + idx
                    return renderOptionRow(opt, i)
                  })}
                </>
              )}
              {searchOptions.some((o) => o.type === 'viewAll') &&
                renderOptionRow(
                  { type: 'viewAll' },
                  productOptions.length + brandOptions.length + categoryOptions.length,
                )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
