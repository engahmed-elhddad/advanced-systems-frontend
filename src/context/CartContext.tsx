'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  part_number: string
  qty: number
  notes?: string
  product_id?: number
}

interface CartContextValue {
  items: CartItem[]
  totalCount: number
  isLoading: boolean
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => Promise<void>
  removeItem: (partNumber: string) => Promise<void>
  updateQty: (partNumber: string, qty: number) => Promise<void>
  submitCart: () => Promise<SubmitResult>
  clearCart: () => void
}

interface SubmitResult {
  bulk_ref: string
  matched: { part_number: string; product_id: number; product_name: string }[]
  unmatched: string[]
  total: number
  count: number
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
  const [isLoading, setIsLoading] = useState(true)
  const visitorId = useRef('')

  // Init visitor_id and fetch cart on mount
  useEffect(() => {
    visitorId.current = getOrCreateVisitorId()
    if (!visitorId.current) {
      setIsLoading(false)
      return
    }
    fetch(`${API_BASE_URL}/api/v1/cart/`, {
      headers: { 'X-Visitor-ID': visitorId.current },
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) setItems(data.items as CartItem[])
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'X-Visitor-ID': visitorId.current }),
    [],
  )

  const addItem = useCallback(async (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const body = { part_number: item.part_number, qty: item.qty ?? 1, notes: item.notes }
    const res = await fetch(`${API_BASE_URL}/api/v1/cart/items`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Failed to add item')
    const data = await res.json()
    setItems(data.items as CartItem[])
  }, [headers])

  const removeItem = useCallback(async (partNumber: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cart/items/${encodeURIComponent(partNumber)}`,
      { method: 'DELETE', headers: headers(), credentials: 'include' },
    )
    if (!res.ok) throw new Error('Failed to remove item')
    const data = await res.json()
    setItems(data.items as CartItem[])
  }, [headers])

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
    if (!res.ok) throw new Error('Failed to update qty')
    const data = await res.json()
    setItems(data.items as CartItem[])
  }, [headers])

  const submitCart = useCallback(async (): Promise<SubmitResult> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/cart/submit`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to submit cart')
    const data = await res.json()
    setItems([])
    return data as SubmitResult
  }, [headers])

  const clearCart = useCallback(() => setItems([]), [])

  const totalCount = items.reduce((sum, i) => sum + (i.qty ?? 1), 0)

  return (
    <CartContext.Provider value={{ items, totalCount, isLoading, addItem, removeItem, updateQty, submitCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
