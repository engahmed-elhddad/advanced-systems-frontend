'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, Menu, Search, X, Zap } from 'lucide-react'
import { adminNavSections } from '@/lib/admin-navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function navActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({
  children,
  userEmail,
  onLogout,
}: {
  children: React.ReactNode
  userEmail: string | null
  onLogout: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const navLinkBase =
    'rounded-xl px-3 py-2.5 text-sm transition-all duration-200 border border-transparent'

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#0B1018] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[440px] w-[440px] rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/4 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-violet-500/16 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'relative z-50 flex w-[284px] flex-col border-r border-white/10 bg-[#0d1420]/90 backdrop-blur-2xl transition-transform duration-300',
          'fixed inset-y-0 left-0 lg:static',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4 lg:h-16">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#c026d3] shadow-lg shadow-orange-500/30">
            <Zap className="h-[18px] w-[18px] text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight text-white">Advanced Systems</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Admin</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'mb-4 flex items-center gap-2 font-semibold',
              navLinkBase,
              navActive(pathname, '/admin') && pathname === '/admin'
                ? 'border-orange-300/60 bg-white/[0.10] text-white shadow-[0_10px_30px_-20px_rgba(255,122,0,0.55)]'
                : 'text-white/80 hover:bg-white/[0.07] hover:text-white'
            )}
          >
            <LayoutGrid className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
            Dashboard
          </Link>

          {adminNavSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="mb-5">
                <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {section.title}
                </div>
                <ul className="space-y-1">
                  {section.links.map((link) => {
                    const active = navActive(pathname, link.href)
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block',
                            navLinkBase,
                            active
                              ? 'border-orange-300/50 bg-white/[0.10] font-semibold text-white shadow-[0_10px_30px_-22px_rgba(255,122,0,0.6)]'
                              : 'text-white/75 hover:bg-white/[0.07] hover:text-white'
                          )}
                        >
                          <span className="block text-sm">{link.label}</span>
                          <span className="mt-0.5 block text-[11px] text-white/45">{link.desc}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Button variant="ghost" className="w-full justify-center text-white/75" asChild>
            <Link href="/" onClick={() => setMobileOpen(false)}>
              ← Marketplace
            </Link>
          </Button>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b1018]/90 px-4 backdrop-blur-xl lg:h-16 lg:px-6">
          <button
            type="button"
            className="rounded-xl p-2 text-white/80 transition-all duration-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={onSearchSubmit} className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-300/50" />
            <input
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search catalog, part #, brand…"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.08] py-2 pl-11 pr-4 text-sm text-white shadow-inner shadow-black/20 placeholder:text-white/50 transition-all duration-300 backdrop-blur-xl focus:border-orange-400/45 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:shadow-[0_0_36px_rgba(255,122,0,0.22),0_0_60px_rgba(168,85,247,0.12)]"
              aria-label="Search"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button variant="primary" size="sm" className="hidden shadow-lg shadow-orange-500/25 sm:inline-flex" asChild>
              <Link href="/rfq">RFQ</Link>
            </Button>
            {userEmail ? (
              <span className="hidden max-w-[160px] truncate text-xs text-white/55 sm:inline" title={userEmail}>
                {userEmail}
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto">
          <div className="relative z-[1] mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
