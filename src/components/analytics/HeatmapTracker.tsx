'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

let maxDepthSent = 0

export function HeatmapTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName?.toLowerCase() || 'unknown'
      const text = (target.textContent || '').trim().slice(0, 60)
      track('heatmap_click', {
        tag,
        text,
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        path: window.location.pathname,
      })
    }

    let timeout: number | null = null
    const onScroll = () => {
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        const doc = document.documentElement
        const scrollTop = window.scrollY + window.innerHeight
        const height = Math.max(1, doc.scrollHeight)
        const depth = Math.min(100, Math.round((scrollTop / height) * 100))
        if (depth >= maxDepthSent + 20 || depth === 100) {
          maxDepthSent = depth
          track('scroll_depth', { depth, path: window.location.pathname })
        }
      }, 150)
    }

    window.addEventListener('click', onClick, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [])

  return null
}
