import { useMemo } from 'react'
import { useShopAuth } from '@/components/providers/ShopAuthProvider'

/** Pricing is public; keep auth hooks for account-only actions. */
export function usePricingGate() {
  const { loading, openLoginModal } = useShopAuth()
  const showExactPricing = true
  return useMemo(
    () => ({ showExactPricing, openLoginModal, loading }),
    [showExactPricing, openLoginModal, loading],
  )
}
