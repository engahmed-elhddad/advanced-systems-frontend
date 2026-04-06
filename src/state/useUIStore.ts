'use client'

import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light'
export type UIToast = {
  id: string
  kind: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
  action?: { label: string; onClick: () => void }
}

type UIState = {
  theme: ThemeMode
  sidebarOpen: boolean
  activeModal: string | null
  toasts: UIToast[]
}

type UIActions = {
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  addToast: (toast: UIToast) => void
  removeToast: (id: string) => void
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem('ui-theme') === 'light' ? 'light' : 'dark'
}

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  theme: getInitialTheme(),
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') localStorage.setItem('ui-theme', next)
    applyThemeClass(next)
    set({ theme: next })
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) => set((s) => ({ toasts: [...s.toasts, toast].slice(-5) })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
