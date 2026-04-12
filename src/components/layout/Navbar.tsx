'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap, Phone } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Brands', href: '/brands' },
  { label: 'Categories', href: '/categories' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const hideInlineSearch = pathname === '/search'

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[rgba(11,31,58,0.72)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_48px_-12px_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      <div className="page-container">
        <div className="flex min-h-[4.75rem] items-center gap-3 py-2.5 sm:gap-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-[#FF8A1A] to-[#E85D00] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_-4px_rgba(255,106,0,0.45)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_12px_28px_-4px_rgba(255,106,0,0.55)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-[0.9375rem] font-semibold tracking-[-0.02em] text-white sm:block">
              Advanced<span className="bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 bg-clip-text text-transparent">Systems</span>
            </span>
          </Link>

          {!hideInlineSearch ? (
            <div className="mx-auto min-w-0 max-w-xl flex-1">
              <SearchBar
                variant="header"
                placeholder="Search by part number, brand, or category"
                showSuggestions
                debounceMs={300}
                searchPath="/search"
                productPath="/products"
                brandPath="/brands"
                categoryPath="/categories"
              />
            </div>
          ) : (
            <div className="mx-auto min-w-0 max-w-2xl flex-1 lg:max-w-3xl" aria-hidden />
          )}

          <div className="hidden shrink-0 items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-[0.8125rem] font-medium tracking-[-0.01em] text-white/70 transition-all duration-300 hover:bg-white/[0.08] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="tel:+201000629229"
              className="hidden items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:text-orange-200 lg:inline-flex"
              aria-label="Call +20 100 062 9229"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs">+20 100 062 9229</span>
            </a>
            <Link
              href="/rfq"
              className="ml-1 inline-flex items-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.03] hover:brightness-110 hover:shadow-xl hover:shadow-orange-500/40"
            >
              Get Price
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl p-2 text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white md:hidden"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-white/10 py-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/rfq"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'mt-2 block rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-orange-500/25'
              )}
            >
              Get Price
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
