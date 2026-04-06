'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: SidebarItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/rfqs', label: 'RFQs', icon: FileText },
]

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 border-r border-white/10 bg-[#070f1f] lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <span className="text-lg font-semibold tracking-tight text-white">AdvancedSystems</span>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-300 transition-all duration-300 ease-in-out',
                'hover:bg-white/5 hover:translate-x-1 hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]',
                active &&
                  'bg-white/10 text-white shadow-[0_0_24px_rgba(255,122,0,0.16)] before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-r-lg before:bg-[#FF7A00]'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
