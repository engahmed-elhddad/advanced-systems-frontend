'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { resolveCurrency, getUSDtoEGPRate, formatPrice } from '../currency'

type Currency = 'USD' | 'EGP'

interface CurrencyContextValue {
  currency: Currency
  rate: number | null
  loading: boolean
  convert: (amountUSD: number | null | undefined) => number | null
  format: (amountUSD: number | null | undefined) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const c = await resolveCurrency()
      if (cancelled) return
      setCurrency(c)
      if (c === 'EGP') {
        const r = await getUSDtoEGPRate()
        if (!cancelled) setRate(r)
      }
      setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [])

  const convert = (amountUSD: number | null | undefined): number | null => {
    if (amountUSD == null) return null
    if (currency === 'EGP' && rate) return Math.round(amountUSD * rate)
    return amountUSD
  }

  const format = (amountUSD: number | null | undefined): string => {
    const converted = convert(amountUSD)
    return formatPrice(converted, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, rate, loading, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}
