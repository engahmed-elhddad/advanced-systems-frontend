'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

export function RouteVisitTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    const path = (pathname || '').trim()
    if (!path || path === lastTrackedPath.current) return
    trackPageView(path, typeof document !== 'undefined' ? document.title : undefined)
    lastTrackedPath.current = path
  }, [pathname])

  return null
}
