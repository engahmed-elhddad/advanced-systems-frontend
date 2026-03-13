'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FileText, Download, Package, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ProductCard } from '@/components/products/ProductCard'
import { API_BASE_URL, CONTACT_EMAIL, WHATSAPP_NUMBER } from '@/app/lib/constants'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

function whatsappQuoteHref(partNumber: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20I%20need%20quote%20for%20${encodeURIComponent(partNumber)}`
}

export function ProductDetail({ product }: { product: any }) {
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
  const inStock = product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0
  const availabilityLabel = inStock ? 'In Stock' : product.availability === 'limited' ? 'Limited' : 'Request Quote'
  const similarProducts = product.similar_products || []

  const nextImage = () => setSelectedImageIndex((i: number) => (i + 1) % images.length)
  const prevImage = () => setSelectedImageIndex((i: number) => (i - 1 + images.length) % images.length)

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.part_number,
    description: product.description || product.short_description || `${brandName} ${product.part_number}`,
    sku: product.part_number,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    category: categoryName,
    image: images.map((img: any) => imageUrl(typeof img === 'string' ? img : img?.url)).filter(Boolean),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={`/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-primary-600 transition-colors">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.part_number}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 border border-gray-200 rounded-lg overflow-hidden group">
              {primaryImage?.url ? (
                <Image
                  src={imageUrl(primaryImage.url)}
                  alt={product.name || product.part_number}
                  fill
                  className="object-contain p-8 transition-transform duration-300 group-hover:scale-110"
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
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className={`shrink-0 w-16 h-16 rounded border overflow-hidden transition-all ${selectedImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Image src={imageUrl(typeof img === 'string' ? img : img?.url)} alt="" width={64} height={64} className="w-full h-full object-contain bg-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Brand, Part Number, RFQ, Specs */}
          <div className="space-y-6">
            {brandName && (
              <Link href={`/brand/${encodeURIComponent(product.brand?.slug || brandName.toLowerCase().replace(/\s+/g, '-'))}`} className="block">
                <BrandLogo brand={brandName} logoClassName="h-10 max-w-[100px] object-contain" />
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-mono tracking-tight">
              {product.part_number}
            </h1>
            {product.name && <p className="text-lg text-gray-600">{product.name}</p>}
            {categoryName && <p className="text-sm text-gray-500">Category: <span className="font-medium text-gray-700">{categoryName}</span></p>}
            <span className={inStock ? 'badge-in-stock' : 'badge-on-request'}>
              {availabilityLabel}
            </span>

            {/* RFQ Section */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/rfq?part_number=${encodeURIComponent(product.part_number)}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-[0_4px_14px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] transition-all">
                <MessageCircle className="w-5 h-5" />
                Request Quote
              </Link>
              <a href={whatsappQuoteHref(product.part_number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Inquiry
              </a>
              <a href={`mailto:${CONTACT_EMAIL}?subject=RFQ%20${encodeURIComponent(product.part_number)}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-all">
                <ExternalLink className="w-5 h-5" />
                Email Quote
              </a>
            </div>

            {/* Industrial Specification Block */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500 w-36">Brand</td><td className="px-4 py-3 text-gray-900">{brandName || '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Part Number</td><td className="px-4 py-3 font-mono text-gray-900">{product.part_number}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Category</td><td className="px-4 py-3 text-gray-900">{categoryName || '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Series</td><td className="px-4 py-3 text-gray-900">{product.series || '—'}</td></tr>
                  <tr className="border-b border-gray-200"><td className="px-4 py-3 font-medium text-gray-500">Availability</td><td className="px-4 py-3 text-gray-900">{availabilityLabel}</td></tr>
                  <tr><td className="px-4 py-3 font-medium text-gray-500">Condition</td><td className="px-4 py-3 text-gray-900">{product.condition || 'New'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Datasheet */}
            {(product.datasheets?.length > 0 || product.datasheet_url || product.datasheet) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Datasheet</h3>
                <a href={product.datasheet_url || product.datasheet} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors">
                  <FileText className="w-5 h-5 text-primary-600" /> Download Datasheet <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        {product.description && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Product Description</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Related Products */}
        {similarProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {similarProducts.slice(0, 6).map((p: any) => (
                <ProductCard
                  key={p.part_number}
                  part_number={p.part_number}
                  manufacturer={p.manufacturer}
                  category={p.category}
                  description={p.description}
                  image_url={p.image_url ? imageUrl(p.image_url) : (p.part_number ? `${API_BASE}/uploads/products/${p.part_number}/main.png` : undefined)}
                  availability="on_request"
                />
              ))}
            </div>
          </div>
        )}

        {/* Additional specs if available */}
        {(product.specs?.length > 0 || product.specifications) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 px-6 py-4 border-b border-gray-200">Technical Specifications</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100"><th className="px-6 py-3 text-left font-semibold text-gray-700">Specification</th><th className="px-6 py-3 text-left font-semibold text-gray-700">Value</th></tr></thead>
              <tbody>
                {product.specs?.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-gray-200"><td className="px-6 py-3 text-gray-600">{s.key}</td><td className="px-6 py-3 text-gray-900">{s.value} {s.unit || ''}</td></tr>
                ))}
                {(!product.specs || product.specs.length === 0) && product.specifications && typeof product.specifications === 'object' && Object.entries(product.specifications).map(([key, value]) => (
                  <tr key={key} className="border-t border-gray-200"><td className="px-6 py-3 text-gray-600">{key}</td><td className="px-6 py-3 text-gray-900">{String(value)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
