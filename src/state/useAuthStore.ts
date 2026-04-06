'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

type AuthActions = {
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    { name: 'auth-storage', skipHydration: true }
  )
)
