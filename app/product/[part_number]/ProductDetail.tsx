'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ProductHero } from '@/components/product/ProductHero'
import { ProductSpecs } from '@/components/product/ProductSpecs'
import { ProductDatasheet } from '@/components/product/ProductDatasheet'
import { CrossReferences } from '@/components/product/CrossReferences'
import { RelatedProductsSection } from '@/components/product/RelatedProductsSection'
import { EngineeringComparisonTable } from '@/components/product/EngineeringComparisonTable'
import { ComponentIntelligence } from '@/components/product/ComponentIntelligence'
import { RfqForm } from '@/components/rfq/RfqForm'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL, CONTACT_EMAIL, SITE_URL, WHATSAPP_NUMBER, categoryToSlug, resolveProductImageUrl, seriesToSlug, specToSlug } from '@/app/lib/constants'

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function resolveSpecs(product: any): Record<string, unknown> | null {
  const raw = product.specifications ?? product.specs
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (Array.isArray(raw) && raw.length) {
    const out: Record<string, unknown> = {}
    raw.forEach((s: any) => {
      const k = s.key ?? s.name
      if (k) out[k] = s.value ?? s.val ?? ''
    })
    return out
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch { return null }
  }
  return null
}

export function ProductDetail({ product, productBasePath = '/product' }: { product: any; productBasePath?: string }) {
  const heroImageSrc = resolveProductImageUrl(
    {
      part_number: product.part_number,
      images: product.images?.map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean),
      image_url: product.image_url,
      image: product.image,
    },
    API_BASE_URL
  )
  const images = product.images && product.images.length > 0
    ? product.images
    : product.image_url || heroImageSrc
      ? [{ url: product.image_url || heroImageSrc, is_primary: true }]
      : []
  const primaryImage = images[0]
  const primaryImageUrl = typeof primaryImage === 'string' ? primaryImage : primaryImage?.url
  const brandName = typeof product.brand === 'string' ? product.brand : (product.brand?.name ?? product.manufacturer ?? product.brand)
  const categoryName = typeof product.category === 'string' ? product.category : (product.category?.name ?? product.category)
  const isGenerated = product.product_status === 'generated'
  const inStock = product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0
  const crossRefsFromApi = product.cross_references
  const [crossRefs, setCrossRefs] = useState<{ alternatives?: any[]; similar_models?: any[]; compatible_modules?: any[] }>(crossRefsFromApi || {})
  const alternatives = crossRefs.alternatives ?? []

  useEffect(() => {
    if (crossRefsFromApi && (crossRefsFromApi.alternatives?.length || crossRefsFromApi.similar_models?.length || crossRefsFromApi.compatible_modules?.length)) {
      setCrossRefs(crossRefsFromApi)
      return
    }
    const pn = product.part_number
    if (!pn) return
    fetch(`${API_BASE_URL}/product/${encodeURIComponent(pn)}/cross-references?limit=6`)
      .then(r => r.json())
      .then(data => setCrossRefs(data))
      .catch(() => {})
  }, [product.part_number, crossRefsFromApi])

  const baseUrl = SITE_URL
  const productUrl = `${baseUrl}${productBasePath}/${encodeURIComponent(product.part_number)}`
  const imgList = images.map((img: any) => imageUrl(typeof img === 'string' ? img : img?.url)).filter(Boolean)
  const offerUrl = `${baseUrl}/rfq?part_number=${encodeURIComponent(product.part_number)}`

  // Structured data: Product, Brand, Offer (schema.org JSON-LD)
  const brandSchema = brandName
    ? { '@type': 'Brand' as const, name: brandName }
    : null
  const offerSchema = {
    '@type': 'Offer' as const,
    url: offerUrl,
    priceCurrency: 'USD',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
    seller: { '@type': 'Organization' as const, name: 'Advanced Systems' },
    itemCondition: 'https://schema.org/NewCondition',
  }
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.part_number,
    description: String(product.description || product.short_description || `${brandName} ${product.part_number} – Datasheet, specifications & RFQ`).slice(0, 500),
    sku: product.part_number,
    mpn: product.part_number,
    url: productUrl,
    ...(brandSchema && { brand: brandSchema }),
    ...(categoryName && { category: categoryName }),
    ...(imgList.length > 0 && { image: imgList.length === 1 ? imgList[0] : imgList }),
    offers: offerSchema,
  }
  const jsonLdString = JSON.stringify(productSchema)

  const specs = resolveSpecs(product)
  const datasheetUrl = product.datasheet_url || product.datasheet
  const fullDatasheetUrl = typeof datasheetUrl === 'string' && datasheetUrl
    ? datasheetUrl.startsWith('http')
      ? datasheetUrl
      : `${API_BASE_URL}${datasheetUrl.startsWith('/') ? '' : '/'}${datasheetUrl}`
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />

      <div className="space-y-10 md:space-y-14">
        {isGenerated && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="font-medium">Limited product information</p>
            <p className="text-sm mt-1">
              This industrial automation component may be obsolete or difficult to source. Submit an RFQ and our team will help locate this part.
            </p>
          </div>
        )}

        <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-accent-600 transition-colors">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.part_number}</span>
        </nav>

        {/* 1. Product Hero */}
        <ProductHero
          product={{
            part_number: product.part_number,
            brand: brandName,
            manufacturer: product.manufacturer,
            category: categoryName,
            series: product.series,
            availability: inStock ? 'in_stock' : 'on_request',
            image_url: primaryImageUrl,
            images: imgList,
          }}
          imageSrc={heroImageSrc}
          imageAlt={product.name || product.part_number}
          apiBase={API_BASE_URL}
          datasheetUrl={fullDatasheetUrl}
          productBasePath={productBasePath}
          categoryHref={categoryName ? (categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`) : null}
        />

        {/* 2. Product Specifications */}
        <ProductSpecs specifications={specs} />

        {/* 3. Datasheet */}
        <ProductDatasheet
          partNumber={product.part_number}
          datasheetUrl={datasheetUrl}
          apiBase={API_BASE_URL}
        />

        {/* 4. Cross References */}
        <CrossReferences
          crossRefs={crossRefs}
          currentProduct={product}
          productBasePath={productBasePath}
          imageUrl={imageUrl}
        />

        {alternatives.length > 0 && (
          <div className="mt-4">
            <EngineeringComparisonTable
              currentProduct={product}
              alternatives={alternatives}
              productBasePath={productBasePath}
            />
          </div>
        )}

        {/* 5. Related Products (fetch from API, horizontal slider) */}
        <RelatedProductsSection
          partNumber={product.part_number}
          apiBase={API_BASE_URL}
          productBasePath={productBasePath}
          title="Related Products"
        />

        {/* 6. RFQ Section */}
        <section id="rfq-form" className="scroll-mt-24 rounded-xl border border-accent-200 bg-white p-5 shadow-sm" aria-labelledby="rfq-heading">
          <h2 id="rfq-heading" className="text-lg font-semibold text-gray-900 mb-4">Request quote</h2>
          <RfqForm partNumber={product.part_number} initialQuantity={1} compact />
        </section>

        {/* Explore by (brand, category, series, specs) — backward compat */}
        <div className="rounded-xl border border-accent-100 bg-accent-50/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Explore by</h3>
          <div className="flex flex-wrap gap-2">
            {brandName && (
              <Link href={getBrandHref({ name: brandName, slug: product.brand?.slug })} className="px-3 py-1.5 rounded-lg bg-white border border-accent-200 hover:border-accent-500 hover:bg-accent-50 text-sm font-medium text-accent-700 transition-colors">
                {brandName} products
              </Link>
            )}
            {categoryName && (
              <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="px-3 py-1.5 rounded-lg bg-white border border-accent-200 hover:border-accent-500 hover:bg-accent-50 text-sm font-medium text-accent-700 transition-colors">
                {categoryName}
              </Link>
            )}
            {product.series && (
              <Link href={`/series/${seriesToSlug(product.series)}`} className="px-3 py-1.5 rounded-lg bg-white border border-accent-200 hover:border-accent-500 hover:bg-accent-50 text-sm font-medium text-accent-700 transition-colors">
                {product.series} series
              </Link>
            )}
            <Link href={`/datasheet/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-white border border-accent-200 hover:border-accent-500 hover:bg-accent-50 text-sm font-medium text-accent-700 transition-colors">
              Datasheet
            </Link>
            <Link href={`/alternatives/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-white border border-accent-200 hover:border-accent-500 hover:bg-accent-50 text-sm font-medium text-accent-700 transition-colors">
              Alternatives
            </Link>
            {specs && typeof specs === 'object' && Object.entries(specs).slice(0, 5).map(([k, v]) => (
              <Link key={k} href={`/spec/${specToSlug(k, String(v))}`} className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-500 text-sm font-medium text-amber-800 transition-colors">
                {k}: {String(v)}
              </Link>
            ))}
          </div>
        </div>

        <ComponentIntelligence partNumber={product.part_number} apiBase={API_BASE_URL} productBasePath={productBasePath} />

        <section aria-labelledby="related-keywords-heading" className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 id="related-keywords-heading" className="text-lg font-semibold text-gray-900 mb-3">Related Search Keywords</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={`/search?q=${encodeURIComponent(`${product.part_number} supplier`)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-accent-50 text-gray-700 hover:text-accent-700 transition-colors">
              {product.part_number} supplier
            </Link>
            <Link href={`/datasheet/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-accent-50 text-gray-700 hover:text-accent-700 transition-colors">
              {product.part_number} datasheet
            </Link>
            <Link href={`/alternatives/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-accent-50 text-gray-700 hover:text-accent-700 transition-colors">
              {product.part_number} replacement
            </Link>
            {brandName && (
              <Link href={`/search?q=${encodeURIComponent(`${brandName} ${product.part_number}`)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-accent-50 text-gray-700 hover:text-accent-700 transition-colors">
                {brandName} {product.part_number}
              </Link>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-700 text-sm leading-relaxed">
          <p>
            Advanced Systems is an industrial automation supplier located in Egypt providing rare and hard-to-find industrial components. This page provides specifications, datasheet and availability for the industrial component{' '}
            <strong>{product.part_number}</strong>. If this part is difficult to source, you can{' '}
            <Link href={`/rfq?part_number=${encodeURIComponent(product.part_number)}`} className="text-accent-600 hover:underline font-medium">request a quote</Link> from our suppliers.
          </p>
        </section>
      </div>
    </>
  )
}
