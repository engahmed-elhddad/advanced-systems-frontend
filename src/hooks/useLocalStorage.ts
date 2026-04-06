'use client'

import { useCallback, useState } from 'react'

function read<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return initial
    return JSON.parse(raw) as T
  } catch {
    return initial
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(() => read(key, initial))

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        localStorage.setItem(key, JSON.stringify(resolved))
        return resolved
      })
    },
    [key]
  )

  return [value, setValue] as const
}
