'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/state/useUIStore'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export interface SidebarProps {
  children: React.ReactNode
  className?: string
}

/** Off-canvas below `lg` (1024px); static on wide screens. */
export function Sidebar({ children, className }: SidebarProps) {
  const open = useUIStore((s) => s.sidebarOpen)
  const setOpen = useUIStore((s) => s.setSidebarOpen)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (isDesktop) setOpen(true)
  }, [isDesktop, setOpen])

  return (
    <>
      {!isDesktop && open ? (
        <button
          type="button"
          className="fixed inset-0 z-[var(--z-modal)] bg-black/50 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--color-border)] bg-[var(--color-background-secondary)] transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        aria-hidden={!open && !isDesktop}
      >
        {children}
      </aside>
    </>
  )
}
