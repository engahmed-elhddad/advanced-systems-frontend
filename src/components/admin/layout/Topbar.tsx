'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Menu, X } from 'lucide-react'

type TopbarProps = {
  userEmail?: string
}

export function Topbar({ userEmail }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = (userEmail || 'AD')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-200 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 lg:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search products, RFQs, orders..."
            aria-label="Search admin content"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-16 text-sm text-white placeholder:text-gray-400 backdrop-blur-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:shadow-[0_0_24px_rgba(255,122,0,0.18)]"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
            ⌘K
          </span>
        </div>

        <button
          type="button"
          aria-label="Open admin profile menu"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-200 backdrop-blur-xl transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/10"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/80 to-purple-500/80 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden max-w-[160px] truncate sm:inline">{userEmail || 'Admin'}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      {mobileOpen ? (
        <div className="border-t border-white/10 px-6 pb-4 lg:hidden">
          <nav className="grid gap-2 pt-3">
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
            >
              Products
            </Link>
            <Link
              href="/admin/rfqs"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
            >
              RFQs
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
