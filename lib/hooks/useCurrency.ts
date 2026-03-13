'use client'
import { useState, useEffect } from 'react'
import { resolveCurrency, getUSDtoEGPRate, formatPrice } from '../currency'

export function useCurrency() {
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('USD')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const c = await resolveCurrency()
      setCurrency(c)
      if (c === 'EGP') {
        const r = await getUSDtoEGPRate()
        setRate(r)
      }
      setLoading(false)
    }
    init()
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

  return { currency, rate, loading, convert, format }
}
