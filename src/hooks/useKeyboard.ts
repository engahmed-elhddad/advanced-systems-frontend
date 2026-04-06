'use client'

import { useEffect } from 'react'

export function useKeyboard(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options?: { enabled?: boolean; event?: 'keydown' | 'keyup' }
) {
  const enabled = options?.enabled ?? true
  const event = options?.event ?? 'keydown'

  useEffect(() => {
    if (!enabled) return
    function onKey(e: KeyboardEvent) {
      if (e.key === key) handler(e)
    }
    window.addEventListener(event, onKey)
    return () => window.removeEventListener(event, onKey)
  }, [key, handler, enabled, event])
}
