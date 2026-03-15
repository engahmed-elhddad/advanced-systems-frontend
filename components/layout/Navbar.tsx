'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
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
              placeholder="Search by part number, brand, or category"
              size="sm"
              showSuggestions
              debounceMs={300}
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
            <Link
              href="/rfq"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white transition-colors shadow-sm ml-1"
            >
              Request Quote
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
                'block px-4 py-2.5 rounded-lg text-sm font-semibold bg-accent-50 text-accent-700 hover:bg-accent-100'
              )}
            >
              Request Quote
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
