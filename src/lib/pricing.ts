import type { ProductPricing } from '@/types/product'

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const egpFmt = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatUsd(amount?: number | null): string | null {
  if (amount == null || !Number.isFinite(amount)) return null
  return usdFmt.format(amount)
}

export function formatEgp(amount?: number | null): string | null {
  if (amount == null || !Number.isFinite(amount)) return null
  return egpFmt.format(amount)
}

export function pricingVatLabel(pricing?: ProductPricing | null): string {
  if (!pricing) return 'VAT 14%'
  return pricing.vat?.included ? 'VAT included (14%)' : 'VAT excluded (14%)'
}
