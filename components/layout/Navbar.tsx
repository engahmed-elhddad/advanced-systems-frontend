'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, Zap, ChevronDown } from 'lucide-react'
import { getBrands, getCategories, getFeaturedProducts } from '@/lib/api'
import { CATEGORIES, FEATURED_BRANDS } from '@/app/lib/constants'
import { SearchBar } from '@/components/search/SearchBar'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { getBrandHref } from '@/lib/brandUtils'
import clsx from 'clsx'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState<'brands' | 'products' | 'categories' | null>(null)
  const [brands, setBrands] = useState<{ name: string; slug?: string }[]>([])
  const [categories, setCategories] = useState<{ name: string; slug?: string }[]>([])
  const [popularProducts, setPopularProducts] = useState<any[]>([])
  const megaRef = useRef<HTMLDivElement>(null)

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
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { id: 'brands', label: 'Manufacturers', href: '/brands' },
    { id: 'products', label: 'Products', href: '/products' },
    { id: 'categories', label: 'Categories', href: '/categories' },
    { href: '/tools', label: 'Tools', hrefOnly: true },
    { href: '/en/news', label: 'News', hrefOnly: true },
    { href: '/product-finder', label: 'Find by Specs', hrefOnly: true },
    { href: '/panel-builder', label: 'Panel Builder', hrefOnly: true },
    { href: '/ai-assistant', label: 'AI Assistant', hrefOnly: true },
    { href: '/knowledge', label: 'Knowledge Hub', hrefOnly: true },
    { href: '/rfq', label: 'Request Quote', cta: true },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm" ref={megaRef}>
      <div className="page-container">
        <div className="flex items-center h-14 gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base hidden sm:block">
              Advanced<span className="text-primary-600">Systems</span>
            </span>
          </Link>

          <div className="flex-1 relative max-w-xl mx-auto">
            <SearchBar placeholder="Search part number, brand..." size="sm" showSuggestions />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.filter(n => !n.cta).map(item => (
              <div key={item.id || item.href} className="relative group/nav">
                {(item as { hrefOnly?: boolean }).hrefOnly ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-all"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                <button
                  onMouseEnter={() => setMegaOpen(item.id as 'brands' | 'products' | 'categories')}
                  className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-all"
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {megaOpen === item.id && (
                  <div
                    onMouseLeave={() => setMegaOpen(null)}
                    className="absolute left-0 top-full pt-1 -translate-x-1/2 ml-6"
                  >
                    <div className="w-[560px] max-h-[380px] overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg p-5 grid grid-cols-3 gap-5">
                      {item.id === 'brands' && (
                        <>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Manufacturers</h4>
                            <div className="grid grid-cols-2 gap-1.5">
                              {brands.slice(0, 8).map(b => (
                                <Link key={b.name} href={getBrandHref(b)} className="flex items-center gap-2 px-3 py-2 rounded border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors">
                                  <BrandLogo brand={b.name} logoClassName="h-5 max-w-[48px] object-contain" badgeClassName="hidden" />
                                  <span className="text-sm text-slate-700 truncate">{b.name}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">More</h4>
                            <ul className="space-y-0.5">
                              {brands.slice(8, 14).map(b => (
                                <li key={b.name}>
                                  <Link href={getBrandHref(b)} className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600">
                                    {b.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Browse</h4>
                            <ul className="space-y-0.5">
                              <li><Link href="/brands" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">All manufacturers →</Link></li>
                              <li><Link href="/search?q=Siemens" className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50">Siemens</Link></li>
                              <li><Link href="/search?q=ABB" className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50">ABB</Link></li>
                              <li><Link href="/search?q=Omron" className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50">Omron</Link></li>
                            </ul>
                          </div>
                        </>
                      )}
                      {item.id === 'products' && (
                        <>
                          <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Popular parts</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {popularProducts.slice(0, 4).map((p: any) => (
                                <Link key={p.part_number || p.id} href={`/product/${encodeURIComponent(p.part_number || p.slug || p.id)}`} className="flex gap-3 p-2.5 rounded border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors">
                                  <div className="w-10 h-10 rounded bg-slate-100 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-mono text-sm font-semibold text-slate-900">{p.part_number}</span>
                                    {p.brand?.name && <p className="text-xs text-slate-500 truncate">{p.brand.name}</p>}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Browse</h4>
                            <ul className="space-y-0.5">
                              <li><Link href="/products" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">All products →</Link></li>
                              <li><Link href="/search?q=PLC" className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50">PLCs</Link></li>
                              <li><Link href="/search?q=Drive" className="block px-3 py-2 rounded text-sm text-slate-700 hover:bg-slate-50">Drives</Link></li>
                              <li><Link href="/bom-analyzer" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">BOM Analyzer</Link></li>
                              <li><Link href="/product-finder" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">Product Finder</Link></li>
                              <li><Link href="/panel-builder" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">Panel Builder</Link></li>
                              <li><Link href="/ai-assistant" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">AI Engineering Assistant</Link></li>
                            </ul>
                          </div>
                        </>
                      )}
                      {item.id === 'categories' && (
                        <>
                          <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categories</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                              {categories.slice(0, 9).map(c => (
                                <Link key={c.name} href={c.slug ? `/category/${c.slug}` : `/search?category=${encodeURIComponent(c.name)}`} className="px-3 py-2 rounded border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 text-sm text-slate-700 font-medium">
                                  {c.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Browse</h4>
                            <ul className="space-y-0.5">
                              <li><Link href="/categories" className="block px-3 py-2 rounded text-sm font-medium text-primary-600 hover:bg-slate-50">All categories →</Link></li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            ))}
            <Link
              href="/rfq"
              className="inline-flex items-center px-4 py-2 rounded text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            >
              Request Quote
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-0.5">
            {navItems.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={clsx("block px-4 py-2.5 rounded text-sm font-medium", l.cta ? "bg-primary-50 text-primary-600" : "text-slate-600 hover:bg-slate-50")}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
