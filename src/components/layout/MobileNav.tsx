'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/search', label: 'Search' },
  { href: '/rfq', label: 'RFQ' },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-[var(--z-dropdown)] border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-2 py-2 lg:hidden"
    >
      <ul className="grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center justify-center rounded-[var(--radius-3)] px-2 py-2 text-xs ${
                  active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-foreground-muted)]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
