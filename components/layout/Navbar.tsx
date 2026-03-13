'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, Zap } from 'lucide-react'
import { suggestProducts } from '@/lib/api'
import clsx from 'clsx'

interface Suggestion {
  id?: number
  part_number: string
  name?: string
  brand_name?: string
  slug?: string
}

export function Navbar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (q: string) => {
    setQuery(q)
    clearTimeout(timeoutRef.current)
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    timeoutRef.current = setTimeout(async () => {
      try {
        const data = await suggestProducts(q)
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch {}
    }, 200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/brands', label: 'Brands' },
    { href: '/categories', label: 'Categories' },
    { href: '/rfq', label: 'Request Quote' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-soft">
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center shadow-primary-sm group-hover:bg-primary-600 transition-colors">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Advanced<span className="text-primary-600">Systems</span>
            </span>
          </Link>

          <div ref={searchRef} className="flex-1 relative max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="search"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search part numbers, brands, categories..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5
                             text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:bg-white
                             transition-all duration-200"
                />
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-card z-50 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.part_number); setShowSuggestions(false); router.push(s.slug ? `/product/${encodeURIComponent(s.slug)}` : `/product/${encodeURIComponent(s.part_number)}`) }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 transition-colors text-left border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <span className="font-mono text-sm font-semibold text-primary-600">{s.part_number}</span>
                      {s.brand_name && <span className="ml-2 text-xs text-gray-500">{s.brand_name}</span>}
                    </div>
                    {s.name && <span className="text-xs text-gray-400 truncate max-w-[200px]">{s.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  l.href === '/rfq'
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-sm"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  l.href === '/rfq' ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
