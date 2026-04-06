'use client'

import { useEffect } from 'react'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  active: boolean,
  initialFocus?: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = nodes[0]
    const last = nodes[nodes.length - 1]

    if (initialFocus?.current) initialFocus.current.focus()
    else first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || nodes.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [active, initialFocus, ref])
}
