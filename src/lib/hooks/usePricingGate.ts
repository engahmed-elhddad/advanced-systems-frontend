import { useMemo } from 'react'
import { useShopAuth } from '@/components/providers/ShopAuthProvider'

/** Exact list prices only after shop session is loaded and user is signed in. */
export function usePricingGate() {
  const { user, loading, openLoginModal } = useShopAuth()
  const showExactPricing = Boolean(user) && !loading
  return useMemo(
    () => ({ showExactPricing, openLoginModal, loading }),
    [showExactPricing, openLoginModal, loading],
  )
}
