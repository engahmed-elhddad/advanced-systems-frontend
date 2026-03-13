'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, Zap, ChevronDown } from 'lucide-react'
import { suggestProducts, getBrands, getCategories, getFeaturedProducts } from '@/lib/api'
import { CATEGORIES, FEATURED_BRANDS } from '@/app/lib/constants'
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
  const [megaOpen, setMegaOpen] = useState<'brands' | 'products' | 'categories' | null>(null)
  const [brands, setBrands] = useState<{ name: string; slug?: string }[]>([])
  const [categories, setCategories] = useState<{ name: string; slug?: string }[]>([])
  const [popularProducts, setPopularProducts] = useState<any[]>([])
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    async function loadMegaData() {
      try {
        const [brandsRes, categoriesRes, productsRes] = await Promise.all([
          getBrands().catch(() => []),
          getCategories().catch(() => []),
          getFeaturedProducts(6).catch(() => []),
        ])
        setBrands(Array.isArray(brandsRes) ? brandsRes.slice(0, 16) : (brandsRes as any)?.brands?.slice(0, 16) || FEATURED_BRANDS.map(b => ({ name: b.name, slug: b.slug })))
        setCategories(Array.isArray(categoriesRes) ? categoriesRes.slice(0, 12) : (categoriesRes as any)?.categories?.slice(0, 12) || CATEGORIES.map(c => ({ name: c.name, slug: c.slug })))
        setPopularProducts(Array.isArray(productsRes) ? productsRes : (productsRes as any)?.products || [])
      } catch {}
    }
    loadMegaData()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(null)
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
        setSuggestions((data as any).suggestions || [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const navItems = [
    { id: 'brands', label: 'Brands', href: '/brands' },
    { id: 'products', label: 'Products', href: '/products' },
    { id: 'categories', label: 'Categories', href: '/categories' },
    { href: '/rfq', label: 'Request Quote', cta: true },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-industrial-gray-200 shadow-soft" ref={megaRef}>
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-industrial-green-600 flex items-center justify-center group-hover:bg-industrial-green-700 transition-colors">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-industrial-gray-900 text-lg hidden sm:block">
              Advanced<span className="text-industrial-green-600">Systems</span>
            </span>
          </Link>

          <div ref={searchRef} className="flex-1 relative max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-gray-400 group-focus-within:text-industrial-green-600 transition-colors" />
                <input
                  type="search"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search part numbers (Siemens, Omron, Allen Bradley)"
                  className="w-full bg-industrial-gray-50 border border-industrial-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-industrial-gray-900 placeholder-industrial-gray-400 focus:outline-none focus:border-industrial-green-500 focus:ring-1 focus:ring-industrial-green-500 focus:bg-white transition-all"
                />
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-industrial-gray-200 rounded-xl shadow-card z-50 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s.part_number); setShowSuggestions(false); router.push(s.slug ? `/product/${encodeURIComponent(s.slug)}` : `/product/${encodeURIComponent(s.part_number)}`) }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-industrial-green-50 transition-colors text-left border-b border-industrial-gray-100 last:border-0"
                  >
                    <div>
                      <span className="font-mono text-sm font-semibold text-industrial-green-600">{s.part_number}</span>
                      {s.brand_name && <span className="ml-2 text-xs text-industrial-gray-500">{s.brand_name}</span>}
                    </div>
                    {s.name && <span className="text-xs text-industrial-gray-400 truncate max-w-[200px]">{s.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.filter(n => !n.cta).map(item => (
              <div key={item.id} className="relative group/nav">
                <button
                  onMouseEnter={() => setMegaOpen(item.id as 'brands' | 'products' | 'categories')}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-industrial-gray-600 hover:text-industrial-green-600 hover:bg-industrial-gray-50 transition-all"
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {megaOpen === item.id && (
                  <div
                    onMouseLeave={() => setMegaOpen(null)}
                    className="absolute left-0 top-full pt-1 -translate-x-1/2 ml-8"
                  >
                    <div className="w-[640px] max-h-[420px] overflow-auto bg-white border border-industrial-gray-200 rounded-xl shadow-card p-6 grid grid-cols-3 gap-6">
                      {item.id === 'brands' && (
                        <>
                          <div>
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Popular Brands</h4>
                            <ul className="space-y-1">
                              {brands.slice(0, 10).map(b => (
                                <li key={b.name}>
                                  <Link href={b.slug ? `/brand/${b.slug}` : '/brands'} className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 hover:text-industrial-green-700 transition-colors">
                                    {b.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">More Brands</h4>
                            <ul className="space-y-1">
                              {brands.slice(10, 18).map(b => (
                                <li key={b.name}>
                                  <Link href={b.slug ? `/brand/${b.slug}` : '/brands'} className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 hover:text-industrial-green-700 transition-colors">
                                    {b.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Quick Links</h4>
                            <ul className="space-y-1">
                              <li><Link href="/brands" className="block px-3 py-2 rounded-lg text-sm font-medium text-industrial-green-600 hover:bg-industrial-green-50 transition-colors">All Brands →</Link></li>
                              <li><Link href="/search?q=Siemens" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">Siemens</Link></li>
                              <li><Link href="/search?q=ABB" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">ABB</Link></li>
                              <li><Link href="/search?q=Allen+Bradley" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">Allen Bradley</Link></li>
                              <li><Link href="/search?q=Omron" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">Omron</Link></li>
                            </ul>
                          </div>
                        </>
                      )}
                      {item.id === 'products' && (
                        <>
                          <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Popular Products</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {popularProducts.slice(0, 4).map((p: any) => (
                                <Link key={p.part_number || p.id} href={`/product/${encodeURIComponent(p.part_number || p.slug || p.id)}`} className="flex gap-3 p-3 rounded-lg border border-industrial-gray-100 hover:border-industrial-green-200 hover:bg-industrial-green-50/50 transition-colors">
                                  <div className="w-12 h-12 rounded-lg bg-industrial-gray-100 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-mono text-sm font-semibold text-industrial-gray-900">{p.part_number}</span>
                                    {p.brand?.name && <p className="text-xs text-industrial-gray-500 truncate">{p.brand.name}</p>}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Browse</h4>
                            <ul className="space-y-1">
                              <li><Link href="/products" className="block px-3 py-2 rounded-lg text-sm font-medium text-industrial-green-600 hover:bg-industrial-green-50 transition-colors">All Products →</Link></li>
                              <li><Link href="/search?q=PLC" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">PLCs</Link></li>
                              <li><Link href="/search?q=Drive" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">Drives</Link></li>
                              <li><Link href="/search?q=Sensor" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">Sensors</Link></li>
                              <li><Link href="/search?q=HMI" className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">HMIs</Link></li>
                            </ul>
                          </div>
                        </>
                      )}
                      {item.id === 'categories' && (
                        <>
                          <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Browse by Category</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {categories.slice(0, 9).map(c => (
                                <Link key={c.name} href={c.slug ? `/search?category=${c.slug}` : `/products?category=${encodeURIComponent(c.name)}`} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-industrial-gray-100 hover:border-industrial-green-200 hover:bg-industrial-green-50/50 transition-colors">
                                  <span className="text-sm font-medium text-industrial-gray-900">{c.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-industrial-gray-500 uppercase tracking-widest mb-3">Quick Links</h4>
                            <ul className="space-y-1">
                              <li><Link href="/categories" className="block px-3 py-2 rounded-lg text-sm font-medium text-industrial-green-600 hover:bg-industrial-green-50 transition-colors">All Categories →</Link></li>
                              {CATEGORIES.slice(0, 5).map(c => (
                                <li key={c.slug}><Link href={`/search?category=${c.slug}`} className="block px-3 py-2 rounded-lg text-sm text-industrial-gray-700 hover:bg-industrial-green-50 transition-colors">{c.name}</Link></li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/rfq"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-industrial-green-600 hover:bg-industrial-green-700 text-white shadow-[0_2px_8px_rgba(34,197,94,0.3)] transition-colors"
            >
              Request Quote
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-industrial-gray-500 hover:text-industrial-gray-700 hover:bg-industrial-gray-100 rounded-lg">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-industrial-gray-100 space-y-1">
            {navItems.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={clsx("block px-4 py-2.5 rounded-lg text-sm font-medium", l.cta ? "bg-industrial-green-50 text-industrial-green-600" : "text-industrial-gray-600 hover:bg-industrial-gray-50")}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
