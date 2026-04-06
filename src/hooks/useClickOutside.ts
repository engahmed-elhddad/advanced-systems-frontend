'use client'

import { useEffect, type RefObject } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return
    function handle(e: MouseEvent) {
      const el = ref.current
      if (el && !el.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onOutside, enabled])
}
