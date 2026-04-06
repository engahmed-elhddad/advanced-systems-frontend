'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap, Phone } from 'lucide-react'
import { SearchBar } from '@/features/search/components/SearchBar'
import clsx from 'clsx'

const navItems = [
  { label: 'Brands', href: '/brands' },
  { label: 'Categories', href: '/categories' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="page-container">
        <div className="flex items-center h-14 gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center group-hover:bg-accent-700 transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base hidden sm:block">
              Advanced<span className="text-accent-600">Systems</span>
            </span>
          </Link>

          <div className="flex-1 min-w-0 max-w-xl mx-auto">
            <SearchBar
              variant="header"
              placeholder="Search by part number, brand, or category"
              showSuggestions
              debounceMs={300}
              searchPath="/search"
              productPath="/products"
              brandPath="/brand"
              categoryPath="/categories"
            />
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-accent-600 hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="tel:+201000629229"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#0072CE] transition-colors duration-150"
              aria-label="Call +20 100 062 9229"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="text-xs">+20 100 062 9229</span>
            </a>
            <Link
              href="/rfq"
              className="inline-flex items-center px-4 py-2.5 rounded-[2px] text-sm font-semibold bg-[#0072CE] hover:bg-[#005BA4] text-white transition-colors duration-150 shadow-sm ml-1"
            >
              Get Price
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/rfq"
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'block px-4 py-2.5 rounded-[2px] text-sm font-semibold bg-[#E8F4FD] text-[#0072CE] hover:bg-[#0072CE]/10'
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
