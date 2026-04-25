'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  resolved: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolved: 'dark',
})

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    const next = resolveTheme(theme)
    document.documentElement.setAttribute('data-theme', next)
    setResolved(next)

    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      const updated = resolveTheme('system')
      document.documentElement.setAttribute('data-theme', updated)
      setResolved(updated)
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
