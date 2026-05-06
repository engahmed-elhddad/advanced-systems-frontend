'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap, Phone, Sun, Moon, Monitor } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { useTheme } from '@/components/ui/ThemeProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CartIcon } from '@/components/cart/CartIcon'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { supportPhoneDisplay, supportPhoneTelHref } from '@/lib/constants'

const NAV_ITEMS = [
  { key: 'nav.brands', href: '/brands' },
  { key: 'nav.categories', href: '/categories' },
  { key: 'nav.rfq', href: '/rfq' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
      aria-label="Toggle theme"
      title={`${t('nav.theme', 'Theme', 'المظهر')}: ${theme}`}
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
  const [cartOpen, setCartOpen] = useState(false)
  const pathname = usePathname()
  const hideInlineSearch = pathname === '/search'
  const { locale, setLocale, t } = useI18n()
  const phoneHref = supportPhoneTelHref() || 'tel:+201000629229'
  const phoneDisplay = supportPhoneDisplay() || '+20 10 0062 9229'

  return (
    <header
      className="sticky top-0 z-50 border-b border-[--border-dark]"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      {/* ── Row 1: Utility bar ─────────────────────────────────────────── */}
      <div className="hidden border-b border-white/[0.06] md:block">
        <div className="page-container flex h-8 items-center justify-between text-xs">
          <span className="text-[--text-secondary]">{t('nav.utilityTagline')}</span>
          <div className="flex items-center gap-4">
            <Link
              href="/rfq/dashboard"
              className="text-[--text-secondary] transition-colors hover:text-[--text-primary]"
            >
              {t('nav.trackOrder')}
            </Link>
            <a
              href={phoneHref}
              className="flex items-center gap-1.5 text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              aria-label={`Call ${phoneDisplay}`}
            >
              <Phone className="h-3 w-3" />
              {phoneDisplay}
            </a>
            <Link href="/login" className="text-[--text-secondary] transition-colors hover:text-[--text-primary]">
              {t('nav.customerLogin')}
            </Link>
            <Link
              href="/admin/login"
              className="text-[--text-secondary] transition-colors hover:text-[--text-primary]"
            >
              {t('nav.adminLogin')}
            </Link>
            <Link
              href="/account/company"
              className="text-[--text-secondary] hover:text-[--text-primary]"
            >
              {t('nav.myCompany')}
            </Link>
            <button
              type="button"
              className="text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                title={t('nav.langToggle', 'EN | عربي', 'EN | عربي')}
            >
              {t('nav.langToggle')}
            </button>
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
              <span className="text-[1.05rem] font-semibold tracking-wide text-white">Advanced</span>
              <span className="text-[1.05rem] font-bold uppercase tracking-wider text-[--accent]">Systems</span>
            </span>
          </Link>

          {/* Search — center, ~50% width */}
          {!hideInlineSearch ? (
            <div className="mx-auto w-full max-w-[52%] min-w-0">
              <SearchBar
                variant="header"
                placeholder={t('nav.searchPlaceholder')}
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
              href={phoneHref}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              aria-label={`Call ${phoneDisplay}`}
            >
              <Phone className="h-4 w-4" />
            </a>
            <ThemeToggle />
            <CartIcon open={cartOpen} onOpenChange={setCartOpen} />
            <Link
              href="/rfq"
              className="ml-1 inline-flex items-center rounded-md bg-[--accent] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
            >
              {t('nav.getPrice')}
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <CartIcon open={cartOpen} onOpenChange={setCartOpen} />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-2 text-[--text-secondary] transition-colors hover:bg-white/[0.08] hover:text-[--text-primary]"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t('nav.closeMenu', 'Close menu', 'إغلاق القائمة') : t('nav.openMenu', 'Open menu', 'فتح القائمة')}
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
              {t(item.key)}
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
                placeholder={t('nav.mobileSearchPlaceholder')}
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
                {t(item.key)}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] pt-2">
              <a
                href={phoneHref}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
              >
                <Phone className="h-4 w-4" />
                {phoneDisplay}
              </a>
              <Link
                href="/login"
                className="block px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.customerLogin')}
              </Link>
              <Link
                href="/admin/login"
                className="block px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.adminLogin')}
              </Link>
              <Link
                href="/account/company"
                className="block px-4 py-2.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.myCompany')}
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-start text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              >
                {t('nav.langToggle')}
              </button>
              <Link
                href="/rfq"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-md bg-[--accent] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
              >
                {t('nav.getPrice')}
              </Link>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  )
}
