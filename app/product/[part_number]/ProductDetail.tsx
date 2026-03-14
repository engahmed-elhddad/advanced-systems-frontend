'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FileText, Download, Package, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ProductTabs } from '@/components/product/ProductTabs'
import { AlternativeProducts } from '@/components/product/AlternativeProducts'
import { EngineeringComparisonTable } from '@/components/product/EngineeringComparisonTable'
import { ComponentIntelligence } from '@/components/product/ComponentIntelligence'
import { RfqForm } from '@/components/rfq/RfqForm'
import { getBrandHref } from '@/lib/brandUtils'
import { API_BASE_URL, CONTACT_EMAIL, SITE_URL, WHATSAPP_NUMBER, categoryToSlug, seriesToSlug, specToSlug } from '@/app/lib/constants'

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function whatsappQuoteHref(partNumber: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20I%20need%20quote%20for%20${encodeURIComponent(partNumber)}`
}

export function ProductDetail({ product, productBasePath = '/part-number' }: { product: any; productBasePath?: string }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const images = product.images && product.images.length > 0
    ? product.images
    : product.image_url
      ? [{ url: product.image_url, is_primary: true }]
      : product.part_number
        ? [{ url: `/uploads/products/${product.part_number}/main.png`, is_primary: true }]
        : []

  const primaryImage = images[selectedImageIndex] || images[0]
  const brandName = product.brand?.name || product.manufacturer || product.brand
  const categoryName = product.category?.name || product.category
  const isGenerated = product.product_status === 'generated'
  const inStock = product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0
  const availabilityLabel = inStock ? 'In Stock' : product.availability === 'limited' ? 'Limited' : 'Request Quote'
  const similarProducts = product.similar_products || []
  const [crossRefs, setCrossRefs] = useState<{ alternatives?: any[]; similar_models?: any[]; compatible_modules?: any[] }>({})

  useEffect(() => {
    const pn = product.part_number
    if (!pn) return
    fetch(`${API_BASE_URL}/product/${encodeURIComponent(pn)}/cross-references?limit=6`)
      .then(r => r.json())
      .then(data => setCrossRefs(data))
      .catch(() => {})
  }, [product.part_number])

  const nextImage = () => setSelectedImageIndex((i: number) => (i + 1) % images.length)
  const prevImage = () => setSelectedImageIndex((i: number) => (i - 1 + images.length) % images.length)

  const baseUrl = SITE_URL
  const productUrl = `${baseUrl}${productBasePath}/${encodeURIComponent(product.part_number)}`
  const imgList = images.map((img: any) => imageUrl(typeof img === 'string' ? img : img?.url)).filter(Boolean)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.part_number,
    description: product.description || product.short_description || `${brandName} ${product.part_number} – Datasheet, specifications & RFQ`,
    sku: product.part_number,
    mpn: product.part_number,
    url: productUrl,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    category: categoryName,
    image: imgList.length ? imgList : undefined,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/rfq?part_number=${encodeURIComponent(product.part_number)}`,
      priceCurrency: 'USD',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
      seller: { '@type': 'Organization', name: 'Advanced Systems' },
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-8">
        {isGenerated && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="font-medium">Limited product information</p>
            <p className="text-sm mt-1">
              This industrial automation component may be obsolete or difficult to source. Submit an RFQ and our team will help locate this part.
            </p>
          </div>
        )}
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-primary-600 transition-colors">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.part_number}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group">
              {primaryImage?.url ? (
                <Image
                  src={imageUrl(primaryImage.url)}
                  alt={product.name || product.part_number}
                  fill
                  className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-28 h-28 text-gray-300" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden transition-all ${selectedImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Image src={imageUrl(typeof img === 'string' ? img : img?.url)} alt="" width={64} height={64} className="w-full h-full object-contain bg-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Part Number, Brand, RFQ, Specs */}
          <div className="space-y-6">
            {brandName && (
              <Link href={getBrandHref({ name: brandName, slug: product.brand?.slug })} className="block">
                <BrandLogo brand={brandName} logoClassName="h-12 max-w-[120px] object-contain" />
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-mono tracking-tight">
              {brandName ? `${brandName} ` : ''}{product.part_number}
            </h1>
            {product.name && <p className="text-lg text-gray-600">{product.name}</p>}
            {categoryName && <p className="text-sm text-gray-500">Category: <span className="font-medium text-gray-700">{categoryName}</span></p>}
            {product.series && <p className="text-sm text-gray-500">Series: <Link href={`/series/${seriesToSlug(product.series)}`} className="font-medium text-primary-600 hover:underline">{product.series}</Link></p>}
            <h2 id="availability" className="sr-only">Availability</h2>
            <span className={inStock ? 'badge-in-stock' : 'badge-on-request'}>
              {availabilityLabel}
            </span>

            <div className="flex flex-wrap gap-3">
              <a href="#rfq-form" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-[0_4px_14px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] transition-all">
                <MessageCircle className="w-5 h-5" />
                Request Quote
              </a>
              <a href={whatsappQuoteHref(product.part_number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <a href={`mailto:${CONTACT_EMAIL}?subject=RFQ%20${encodeURIComponent(product.part_number)}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors">
                <ExternalLink className="w-5 h-5" />
                Email Quote
              </a>
            </div>

            {/* Inline RFQ form */}
            <div id="rfq-form" className="scroll-mt-24 rounded-xl border border-primary-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Request quote in seconds</h3>
              <RfqForm partNumber={product.part_number} initialQuantity={1} compact />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500 w-36">Brand</td><td className="px-4 py-3 text-gray-900">{brandName ? <Link href={getBrandHref({ name: brandName, slug: product.brand?.slug })} className="text-primary-600 hover:underline">{brandName}</Link> : '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Part Number</td><td className="px-4 py-3 font-mono text-gray-900">{product.part_number}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Category</td><td className="px-4 py-3 text-gray-900">{categoryName ? <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="text-primary-600 hover:underline">{categoryName}</Link> : '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Series</td><td className="px-4 py-3 text-gray-900">{product.series ? <Link href={`/series/${seriesToSlug(product.series)}`} className="text-primary-600 hover:underline">{product.series}</Link> : '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Availability</td><td className="px-4 py-3 text-gray-900">{availabilityLabel}</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-gray-500">Condition</td><td className="px-4 py-3 text-gray-900">{product.condition || 'New'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Internal linking – brand, category, series, specification pages */}
            <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Explore by</h3>
              <div className="flex flex-wrap gap-2">
                {brandName && (
                  <Link href={getBrandHref({ name: brandName, slug: product.brand?.slug })} className="px-3 py-1.5 rounded-lg bg-white border border-primary-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-primary-700 transition-colors">
                    {brandName} products
                  </Link>
                )}
                {categoryName && (
                  <Link href={categoryToSlug(String(categoryName)) ? `/category/${categoryToSlug(String(categoryName))}` : `/search?category=${encodeURIComponent(categoryName)}`} className="px-3 py-1.5 rounded-lg bg-white border border-primary-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-primary-700 transition-colors">
                    {categoryName}
                  </Link>
                )}
                {product.series && (
                  <Link href={`/series/${seriesToSlug(product.series)}`} className="px-3 py-1.5 rounded-lg bg-white border border-primary-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-primary-700 transition-colors">
                    {product.series} series
                  </Link>
                )}
                <Link href={`/datasheet/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-white border border-primary-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-primary-700 transition-colors">
                  Datasheet
                </Link>
                <Link href={`/alternatives/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-white border border-primary-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-primary-700 transition-colors">
                  Alternatives
                </Link>
                {(() => {
                  const specs = product.specs || (typeof product.specifications === 'object' ? product.specifications : null)
                  if (!specs || !Array.isArray(specs)) {
                    try {
                      const parsed = typeof product.specifications === 'string' ? JSON.parse(product.specifications || '{}') : {}
                      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        return Object.entries(parsed).slice(0, 5).map(([k, v]) => (
                          <Link key={k} href={`/spec/${specToSlug(k, String(v))}`} className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-500 text-sm font-medium text-amber-800 transition-colors">
                            {k}: {String(v)}
                          </Link>
                        ))
                      }
                    } catch { /* ignore */ }
                    return null
                  }
                  return specs.slice(0, 5).map((s: any) => {
                    const k = s.key ?? s.name ?? ''
                    const v = s.value ?? s.val ?? ''
                    if (!k) return null
                    return (
                      <Link key={k} href={`/spec/${specToSlug(k, String(v))}`} className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-500 text-sm font-medium text-amber-800 transition-colors">
                        {k}: {String(v)}
                      </Link>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Predictive Component Intelligence */}
            <ComponentIntelligence
              partNumber={product.part_number}
              apiBase={API_BASE_URL}
              productBasePath={productBasePath}
            />
          </div>
        </div>

        {/* Tabs: Description, Specifications, Datasheet, Related Products */}
        <h2 id="specifications" className="text-xl font-semibold text-gray-900 mb-2">Specifications</h2>
        <h2 id="datasheet" className="sr-only">Datasheet</h2>
        <ProductTabs
          description={product.description}
          specs={product.specs}
          specifications={product.specifications}
          datasheetUrl={product.datasheet_url || product.datasheet}
          datasheets={product.datasheets}
          relatedProducts={similarProducts}
          crossRefs={crossRefs}
          imageUrl={imageUrl}
          apiBase={API_BASE_URL}
          productBasePath={productBasePath}
        />

        {/* Alternative Products – full cards with image, brand, quick comparison */}
        <h2 id="alternatives" className="text-xl font-semibold text-gray-900 mb-4">Alternatives</h2>
        {(crossRefs.alternatives?.length ?? 0) > 0 ? (
          <>
            <AlternativeProducts
              alternatives={crossRefs.alternatives ?? []}
              currentProduct={product}
              productBasePath={productBasePath}
              imageUrl={imageUrl}
            />
          </>
        ) : (
          <p className="text-gray-600 text-sm mb-4">
            <Link href={`/alternatives/${encodeURIComponent(product.part_number)}`} className="text-primary-600 hover:underline font-medium">View alternative and replacement components</Link> for {product.part_number}.
          </p>
        )}

        {/* Engineering View – comparison table */}
        {(crossRefs.alternatives?.length ?? 0) > 0 && (
          <EngineeringComparisonTable
            currentProduct={product}
            alternatives={crossRefs.alternatives ?? []}
            productBasePath={productBasePath}
          />
        )}

        {/* Compatible Modules (compact links) */}
        {(crossRefs.compatible_modules?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Compatible Modules</h3>
            <div className="flex flex-wrap gap-2">
              {(crossRefs.compatible_modules ?? []).slice(0, 6).map((p: any) => (
                <Link key={p.part_number} href={`${productBasePath}/${encodeURIComponent(p.part_number)}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-mono transition-colors">
                  {p.part_number}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Search Keywords – SEO keyword block */}
        <section aria-labelledby="related-keywords-heading" className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 id="related-keywords-heading" className="text-lg font-semibold text-gray-900 mb-3">Related Search Keywords</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={`/search?q=${encodeURIComponent(`${product.part_number} supplier`)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors">
              {product.part_number} supplier
            </Link>
            <Link href={`/datasheet/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors">
              {product.part_number} datasheet
            </Link>
            <Link href={`/availability/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors">
              {product.part_number} availability
            </Link>
            <Link href={`/alternatives/${encodeURIComponent(product.part_number)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors">
              {product.part_number} replacement
            </Link>
            {brandName && (
              <Link href={`/search?q=${encodeURIComponent(`${brandName} ${product.part_number}`)}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors">
                {brandName} {product.part_number}
              </Link>
            )}
          </div>
        </section>

        {/* Local SEO – company location */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-700 text-sm leading-relaxed">
          <p>
            Advanced Systems is an industrial automation supplier located in Egypt providing rare and hard-to-find industrial components. This page provides specifications, datasheet and availability for the industrial component{' '}
            <strong>{product.part_number}</strong>. If this part is difficult to source, you can{' '}
            <Link href={`/rfq?part_number=${encodeURIComponent(product.part_number)}`} className="text-primary-600 hover:underline font-medium">request a quote</Link> from our suppliers.
          </p>
        </section>
      </div>
    </>
  )
}
