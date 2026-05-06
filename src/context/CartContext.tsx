'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  part_number: string
  qty: number
  notes?: string
  product_id?: number
  product_name?: string | null
  hs_code?: string | null
  unit_price_usd: number
  line_total_usd: number
  unit_price_egp: number
  line_total_egp: number
}

export interface CartTotals {
  subtotal_usd: number
  subtotal_egp: number
  vat_rate: number
  vat_usd: number
  vat_egp: number
  total_usd: number
  total_egp: number
}

interface CartContextValue {
  items: CartItem[]
  totals: CartTotals
  totalCount: number
  isLoading: boolean
  addItem: (item: AddCartItemInput) => Promise<void>
  removeItem: (partNumber: string) => Promise<void>
  updateQty: (partNumber: string, qty: number) => Promise<void>
  checkout: (payload: CheckoutPayload) => Promise<CheckoutResult>
  refreshCart: () => Promise<void>
  clearCart: () => void
}

interface CheckoutPayload {
  payment_method: 'paymob_card' | 'bank_transfer' | 'net_30'
  phone?: string
  email?: string
  notes?: string
}

interface AddCartItemInput {
  part_number: string
  qty?: number
  notes?: string
}

interface CheckoutResult {
  order_ref: string
  payment_method: string
  totals: CartTotals
  payment_context: Record<string, unknown>
  notification: { attempted: boolean; sent: boolean; error?: string | null }
}

interface CartApiResponse {
  items: CartItem[]
  totals: CartTotals
}

const EMPTY_TOTALS: CartTotals = {
  subtotal_usd: 0,
  subtotal_egp: 0,
  vat_rate: 0.14,
  vat_usd: 0,
  vat_egp: 0,
  total_usd: 0,
  total_egp: 0,
}

async function getApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string }
    if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail
  } catch {
    // ignore json parse errors
  }
  try {
    const text = await res.text()
    if (text.trim()) return text
  } catch {
    // ignore body read errors
  }
  return fallback
}

// ── Visitor ID ────────────────────────────────────────────────────────────────

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'as_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

// ── Context ───────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [totals, setTotals] = useState<CartTotals>(EMPTY_TOTALS)
  const [isLoading, setIsLoading] = useState(true)
  const visitorId = useRef('')

  // Init visitor_id and fetch cart on mount
  useEffect(() => {
    visitorId.current = getOrCreateVisitorId()
    if (!visitorId.current) {
      setIsLoading(false)
      return
    }
    void (async () => {
      try {
        await refreshCartInternal()
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'X-Visitor-ID': visitorId.current }),
    [],
  )

  const applyCart = useCallback((data: CartApiResponse | null) => {
    setItems(data?.items ?? [])
    setTotals(data?.totals ?? EMPTY_TOTALS)
  }, [])

  const refreshCartInternal = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/cart/`, {
      headers: { 'X-Visitor-ID': visitorId.current },
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load cart')
    const data = (await res.json()) as CartApiResponse
    applyCart(data)
  }, [applyCart])

  const addItem = useCallback(async (item: AddCartItemInput) => {
    const body = { part_number: item.part_number, qty: item.qty ?? 1, notes: item.notes }
    const res = await fetch(`${API_BASE_URL}/api/v1/cart/items`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await getApiErrorMessage(res, 'Failed to add item'))
    const data = (await res.json()) as CartApiResponse
    applyCart(data)
  }, [applyCart, headers])

  const removeItem = useCallback(async (partNumber: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cart/items/${encodeURIComponent(partNumber)}`,
      { method: 'DELETE', headers: headers(), credentials: 'include' },
    )
    if (!res.ok) throw new Error(await getApiErrorMessage(res, 'Failed to remove item'))
    const data = (await res.json()) as CartApiResponse
    applyCart(data)
  }, [applyCart, headers])

  const updateQty = useCallback(async (partNumber: string, qty: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cart/items/${encodeURIComponent(partNumber)}`,
      {
        method: 'PATCH',
        headers: headers(),
        credentials: 'include',
        body: JSON.stringify({ qty }),
      },
    )
    if (!res.ok) throw new Error(await getApiErrorMessage(res, 'Failed to update qty'))
    const data = (await res.json()) as CartApiResponse
    applyCart(data)
  }, [applyCart, headers])

  const checkout = useCallback(async (payload: CheckoutPayload): Promise<CheckoutResult> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/cart/checkout`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Failed to checkout')
    }
    const data = (await res.json()) as CheckoutResult
    await refreshCartInternal()
    return data
  }, [headers, refreshCartInternal])

  const refreshCart = useCallback(async () => {
    await refreshCartInternal()
  }, [refreshCartInternal])

  const clearCart = useCallback(() => {
    setItems([])
    setTotals(EMPTY_TOTALS)
  }, [])

  const totalCount = items.reduce((sum, i) => sum + (i.qty ?? 1), 0)

  return (
    <CartContext.Provider value={{ items, totals, totalCount, isLoading, addItem, removeItem, updateQty, checkout, refreshCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
