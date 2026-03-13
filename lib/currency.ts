import { getExchangeRate } from './api'

let rateCache: { rate: number; ts: number } | null = null
let countryCache: string | null = null
const RATE_TTL = 3600 * 1000 // 1 hour in ms

export async function getUserCountry(): Promise<string> {
  if (countryCache) return countryCache
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'force-cache' })
    const data = await res.json()
    countryCache = data.country_code || 'US'
    return countryCache
  } catch {
    return 'US'
  }
}

export async function getUSDtoEGPRate(): Promise<number | null> {
  if (rateCache && Date.now() - rateCache.ts < RATE_TTL) {
    return rateCache.rate
  }
  try {
    const data = await getExchangeRate('USD', 'EGP')
    if (data?.rate) {
      rateCache = { rate: data.rate, ts: Date.now() }
      return data.rate
    }
  } catch {}
  return null
}

export async function resolveCurrency(): Promise<'USD' | 'EGP'> {
  const country = await getUserCountry()
  return country === 'EG' ? 'EGP' : 'USD'
}

export function formatPrice(amount: number | null | undefined, currency: 'USD' | 'EGP'): string {
  if (amount == null) return 'Request Quote'
  if (currency === 'EGP') {
    return `${Math.round(amount).toLocaleString('en-EG')} EGP`
  }
  return `$${amount.toFixed(2)}`
}

export async function convertToLocalCurrency(amountUSD: number): Promise<{ amount: number; currency: 'USD' | 'EGP' }> {
  const currency = await resolveCurrency()
  if (currency === 'EGP') {
    const rate = await getUSDtoEGPRate()
    if (rate) {
      return { amount: Math.round(amountUSD * rate), currency: 'EGP' }
    }
  }
  return { amount: amountUSD, currency: 'USD' }
}
