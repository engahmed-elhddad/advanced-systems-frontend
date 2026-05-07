'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { fetchShopSession, signOutShop, type ShopUser } from '@/lib/auth'

type ShopAuthContextValue = {
  user: ShopUser | null
  loading: boolean
  refreshSession: () => Promise<void>
  openLoginModal: () => void
  signOut: () => Promise<void>
}

const ShopAuthContext = createContext<ShopAuthContextValue | null>(null)

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<ShopUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const data = await fetchShopSession()
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const openLoginModal = useCallback(() => {
    router.push('/account/company')
  }, [router])

  const signOut = useCallback(async () => {
    try {
      await signOutShop()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshSession,
      openLoginModal,
      signOut,
    }),
    [user, loading, refreshSession, openLoginModal, signOut],
  )

  return (
    <ShopAuthContext.Provider value={value}>
      {children}
    </ShopAuthContext.Provider>
  )
}

export function useShopAuth(): ShopAuthContextValue {
  const ctx = useContext(ShopAuthContext)
  if (!ctx) {
    throw new Error('useShopAuth must be used within ShopAuthProvider')
  }
  return ctx
}
