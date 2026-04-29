/**
 * Schema.org Product JSON-LD builder for the storefront PDP.
 *
 * Hybrid pricing model:
 *   - Priced product → emit full Offer (price + currency + return + shipping).
 *   - Unpriced product → omit `offers` entirely (Google's recommended pattern;
 *     keeps Product schema, no Merchant rich card, no Search Console error).
 *
 * Price source priority:
 *   1. Lowest positive variant price (wizard saves on ProductOffer.price in EGP)
 *   2. product.price_usd > 0 (legacy USD)
 *   3. product.list_price > 0 (legacy USD fallback)
 */

import type { ProductVariantOption } from '@/lib/productVariants'
import { minPositiveVariantPrice } from '@/lib/productVariants'

const STANDARD_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'EG',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
} as const

const STANDARD_SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'EGP' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'EG' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
  },
} as const

type Currency = 'USD' | 'EGP'
type PriceInfo = { price: number; currency: Currency }

function resolvePrice(
  product: Record<string, unknown>,
  variants: ProductVariantOption[],
): PriceInfo | null {
  const v = minPositiveVariantPrice(variants)
  if (v != null && v > 0) return { price: v, currency: 'EGP' }
  const usd = product.price_usd
  if (typeof usd === 'number' && Number.isFinite(usd) && usd > 0) {
    return { price: usd, currency: 'USD' }
  }
  const lp = product.list_price ?? product.price
  if (typeof lp === 'number' && Number.isFinite(lp) && lp > 0) {
    return { price: lp, currency: 'USD' }
  }
  return null
}

function mapItemCondition(condition?: string): string {
  const c = (condition ?? '').toLowerCase().trim()
  if (c === 'refurbished') return 'https://schema.org/RefurbishedCondition'
  if (c === 'used' || c === 'obsolete') return 'https://schema.org/UsedCondition'
  return 'https://schema.org/NewCondition'
}

function priceValidUntilDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export type BuildProductJsonLdArgs = {
  product: Record<string, unknown>
  variants: ProductVariantOption[]
  productUrl: string
  productName: string
  partNum: string
  brandName: string
  categoryName: string
  schemaImages: string[]
  schemaDescription: string
  schemaAvailability: string
  companyName: string
  /** When set, emitted `Offer.priceCurrency` uses this value instead of source-derived currency. */
  forceCurrency?: string
}

export type BuildBreadcrumbJsonLdArgs = {
  items: Array<{ name: string; url: string }>
}

export function buildBreadcrumbJsonLd(args: BuildBreadcrumbJsonLdArgs): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: args.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildProductJsonLd(args: BuildProductJsonLdArgs): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: args.productName,
    image: args.schemaImages,
    description: args.schemaDescription.slice(0, 5000),
    sku: args.partNum,
    mpn: args.partNum,
    category: args.categoryName || 'Industrial Parts',
    brand: { '@type': 'Brand', name: args.brandName || 'Industrial' },
    url: args.productUrl,
  }

  const priceInfo = resolvePrice(args.product, args.variants)
  if (!priceInfo) {
    // Unpriced: no offers block — Google rejects half-empty offers; this keeps
    // the product indexable without a Merchant rich result.
    return base
  }

  return {
    ...base,
    offers: {
      '@type': 'Offer',
      url: args.productUrl,
      price: priceInfo.price,
      priceCurrency: args.forceCurrency ?? priceInfo.currency,
      priceValidUntil: priceValidUntilDays(30),
      availability: args.schemaAvailability,
      itemCondition: mapItemCondition(args.variants[0]?.condition),
      seller: { '@type': 'Organization', name: args.companyName },
      hasMerchantReturnPolicy: STANDARD_RETURN_POLICY,
      shippingDetails: STANDARD_SHIPPING_DETAILS,
    },
  }
}
