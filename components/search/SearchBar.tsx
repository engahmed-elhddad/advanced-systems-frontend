'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Suggestion {
  part_number: string
  brand?: string
  category?: string
}

interface SearchBarProps {
  placeholder?: string
  size?: 'sm' | 'lg'
  className?: string
  showSuggestions?: boolean
  /** Debounce ms for autocomplete (default 300) */
  debounceMs?: number
}

export function SearchBar({
  placeholder = 'Search by part number (e.g. 6ES7400-1PB00-0AA0)',
  size = 'sm',
  className = '',
  showSuggestions = true,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [show, setShow] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!showSuggestions || query.trim().length < 2) {
      setSuggestions([])
      setShow(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query.trim())}&limit=8`)
        const data = await res.json()
        const raw = data.results ?? data.hits ?? data.suggestions ?? []
        const items = raw.map((r: Record<string, unknown>) => {
          const brand = r.brand
          const category = r.category
          return {
            part_number: String(r.part_number ?? r.partNumber ?? ''),
            brand: typeof brand === 'string' ? brand : (brand && typeof brand === 'object' && 'name' in brand ? String((brand as { name?: string }).name ?? '') : undefined),
            category: typeof category === 'string' ? category : (category && typeof category === 'object' && 'name' in category ? String((category as { name?: string }).name ?? '') : undefined),
          }
        }).filter((s: Suggestion) => s.part_number)
        setSuggestions(items)
        setShow(true)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
        setShow(true)
      }
    }, debounceMs)
    return () => clearTimeout(debounceRef.current)
  }, [query, showSuggestions, debounceMs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShow(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSelect = useCallback(
    (pn: string) => {
      setShow(false)
      setQuery('')
      router.push(`/product/${encodeURIComponent(pn)}`)
    },
    [router]
  )

  const totalOptions = suggestions.length + 1
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!show || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < totalOptions - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : totalOptions - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex].part_number)
      } else if (activeIndex === suggestions.length) {
        setShow(false)
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setShow(false)
      setActiveIndex(-1)
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const isLg = size === 'lg'
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className={`
            flex bg-white rounded-xl border-2 border-gray-200
            transition-all duration-200
            focus-within:border-accent-500 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]
            focus-within:ring-0 hover:border-gray-300
            ${isLg ? 'p-2.5 shadow-xl' : 'p-1.5'}
          `}
        >
          <Search className={`text-gray-400 shrink-0 self-center ${isLg ? 'w-6 h-6 ml-3' : 'w-5 h-5 ml-2.5'}`} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShow(true)}
            onBlur={() => setTimeout(() => setShow(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`
              flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400
              ${isLg ? 'pl-4 pr-4 py-4 text-lg' : 'pl-3 pr-4 py-2.5 text-sm'}
            `}
          />
          <button
            type="submit"
            className={`
              shrink-0 font-semibold text-white bg-accent-600 hover:bg-accent-700
              rounded-lg transition-colors
              ${isLg ? 'px-8 py-3 text-base' : 'px-5 py-2 text-sm'}
            `}
          >
            Search
          </button>
        </div>
      </form>
          {showSuggestions && show && (suggestions.length > 0 || query.trim().length >= 2) && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <Link
              key={`${s.part_number}-${i}`}
              href={`/product/${encodeURIComponent(s.part_number)}`}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                activeIndex === i ? 'bg-accent-50' : ''
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setShow(false)}
            >
              <span className="font-mono text-sm font-semibold text-accent-600">{s.part_number}</span>
              {s.brand && <span className="text-xs text-gray-500">{s.brand}</span>}
              {s.category && <span className="text-xs text-gray-400">{s.category}</span>}
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setShow(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent-600 hover:bg-accent-50 border-t border-gray-100 transition-colors"
          >
            <Search className="w-4 h-4" />
            View all results for &quot;{query.trim()}&quot;
          </Link>
        </div>
      )}
    </div>
  )
}
