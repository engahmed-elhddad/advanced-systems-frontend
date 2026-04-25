'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap, Phone, Sun, Moon, Monitor } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { useTheme } from '@/components/ui/ThemeProvider'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Brands', href: '/brands' },
  { label: 'Categories', href: '/categories' },
  { label: 'Industries', href: '/industries' },
  { label: 'RFQ Tool', href: '/rfq' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      {theme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </button>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const hideInlineSearch = pathname === '/search'

  return (
    <header
      className="sticky top-0 z-50 border-b border-[--border-dark]"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      {/* ── Row 1: Utility bar ─────────────────────────────────────────── */}
      <div className="hidden border-b border-white/[0.06] md:block">
        <div className="page-container flex h-8 items-center justify-between text-xs">
          <span className="text-[--text-secondary]">Industrial Automation Parts &amp; Components</span>
          <div className="flex items-center gap-4">
            <Link
              href="/rfq/dashboard"
              className="text-[--text-secondary] transition-colors hover:text-[--text-primary]"
            >
              Track Order
            </Link>
            <a
              href="tel:+201000629229"
              className="flex items-center gap-1.5 text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              aria-label="Call +20 100 062 9229"
            >
              <Phone className="h-3 w-3" />
              +20 100 062 9229
            </a>
            <Link
              href="/admin/login"
              className="text-[--text-secondary] transition-colors hover:text-[--text-primary]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 2: Main header ─────────────────────────────────────────── */}
      <div className="page-container">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--accent] shadow-[0_4px_12px_-2px_rgba(255,106,0,0.4)] transition-colors hover:bg-[--accent-hover]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span
              className="hidden items-baseline gap-[0.15em] sm:inline-flex"
              style={{ fontFamily: 'var(--font-rajdhani)' }}
            >
              <span className="text-[1.05rem] font-semibold tracking-wide text-[--text-primary]">Advanced</span>
              <span className="text-[1.05rem] font-bold uppercase tracking-wider text-[--accent]">Systems</span>
            </span>
          </Link>

          {/* Search — center, ~50% width */}
          {!hideInlineSearch ? (
            <div className="mx-auto w-full max-w-[52%] min-w-0">
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
            <div className="flex-1" aria-hidden />
          )}

          {/* Right actions */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
            <a
              href="tel:+201000629229"
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              aria-label="Call +20 100 062 9229"
            >
              <Phone className="h-4 w-4" />
            </a>
            <ThemeToggle />
            <Link
              href="/rfq"
              className="ml-1 inline-flex items-center rounded-md bg-[--accent] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
            >
              Get Price
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-2 text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 3: Nav bar ─────────────────────────────────────────────── */}
      <div
        className="hidden border-t border-white/[0.06] md:block"
        style={{ backgroundColor: 'var(--bg-header)' }}
      >
        <div className="page-container flex h-10 items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-white/[0.08] text-[--text-primary]'
                  : 'text-[--text-secondary] hover:bg-white/[0.06] hover:text-[--text-primary]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="border-t border-[--border-dark] md:hidden"
          style={{ backgroundColor: 'var(--bg-header)' }}
        >
          <div className="page-container space-y-1 py-3">
            {/* Mobile search */}
            <div className="pb-2">
              <SearchBar
                variant="header"
                placeholder="Search parts, brands…"
                showSuggestions
                debounceMs={300}
                searchPath="/search"
                productPath="/products"
                brandPath="/brands"
                categoryPath="/categories"
              />
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-4 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] pt-2">
              <a
                href="tel:+201000629229"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              >
                <Phone className="h-4 w-4" />
                +20 100 062 9229
              </a>
              <Link
                href="/admin/login"
                className="block px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/rfq"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-md bg-[--accent] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
              >
                Get Price
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
