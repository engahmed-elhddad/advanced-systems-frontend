import { describe, expect, it } from 'vitest'
import { buildBreadcrumbJsonLd, buildProductJsonLd } from './productJsonLd'
import type { ProductVariantOption } from './productVariants'

function baseArgs(overrides: Partial<Parameters<typeof buildProductJsonLd>[0]> = {}) {
  const variants: ProductVariantOption[] = [
    { id: 1, condition: 'new', stock: 3, price: 12.34 },
  ]
  return {
    product: {} as Record<string, unknown>,
    variants,
    productUrl: 'https://example.com/p',
    productName: 'Widget',
    partNum: 'SKU-1',
    brandName: 'Acme',
    categoryName: 'Motors',
    schemaImages: ['https://example.com/i.jpg'],
    schemaDescription: 'A fine widget for testing.',
    schemaAvailability: 'https://schema.org/InStock',
    companyName: 'TestCo',
    ...overrides,
  }
}

describe('buildProductJsonLd', () => {
  it('emits Product shape with core fields populated', () => {
    const result = buildProductJsonLd(baseArgs())
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Product')
    expect(result.name).toBe('Widget')
    expect(result.sku).toBe('SKU-1')
    expect(result.mpn).toBe('SKU-1')
    expect(result.category).toBe('Motors')
    expect(result.url).toBe('https://example.com/p')
    expect(result.description).toBe('A fine widget for testing.')
    expect(Array.isArray(result.image)).toBe(true)
    const brand = result.brand as Record<string, unknown>
    expect(brand['@type']).toBe('Brand')
    expect(brand.name).toBe('Acme')
    const offers = result.offers as Record<string, unknown>
    expect(offers['@type']).toBe('Offer')
    expect(offers.price).toBe(12.34)
  })

  it('omits offers when resolvePrice returns null', () => {
    const result = buildProductJsonLd(
      baseArgs({
        variants: [{ id: 1, condition: 'new', stock: 0, price: null }],
        product: {},
      }),
    )
    expect(result.offers).toBeUndefined()
  })

  it('resolves price from legacy product.price when list_price absent', () => {
    const result = buildProductJsonLd(
      baseArgs({
        variants: [],
        product: { price: 99.5 } as Record<string, unknown>,
      }),
    )
    const offers = result.offers as Record<string, unknown>
    expect(offers.price).toBe(99.5)
    expect(offers.priceCurrency).toBe('USD')
  })

  it('sets Offer.priceCurrency to forceCurrency when provided (overrides EGP from variants)', () => {
    const result = buildProductJsonLd(
      baseArgs({
        variants: [{ id: 1, condition: 'new', stock: 2, price: 500 }],
        product: {},
        forceCurrency: 'USD',
      }),
    )
    const offers = result.offers as Record<string, unknown>
    expect(offers).toBeDefined()
    expect(offers.priceCurrency).toBe('USD')
    expect(offers.price).toBe(500)
  })
})

describe('buildBreadcrumbJsonLd', () => {
  it('maps four items to positions 1 through 4', () => {
    const result = buildBreadcrumbJsonLd({
      items: [
        { name: 'Home', url: 'https://x.com/' },
        { name: 'Products', url: 'https://x.com/products' },
        { name: 'Cat', url: 'https://x.com/c' },
        { name: 'Part', url: 'https://x.com/p' },
      ],
    })
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('BreadcrumbList')
    const list = result.itemListElement as Array<Record<string, unknown>>
    expect(list[0].position).toBe(1)
    expect(list[3].position).toBe(4)
    expect(list[0].name).toBe('Home')
    expect(list[3].item).toBe('https://x.com/p')
  })

  it('returns empty itemListElement for empty items', () => {
    const result = buildBreadcrumbJsonLd({ items: [] })
    expect(result.itemListElement).toEqual([])
  })
})
