'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackVisit } from '@/lib/analytics'

export function RouteVisitTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    const path = (pathname || '').trim()
    if (!path || path === lastTrackedPath.current) return
    trackVisit()
    lastTrackedPath.current = path
  }, [pathname])

  return null
}
