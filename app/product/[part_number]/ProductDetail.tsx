'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FileText, Download, Package, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

export function ProductDetail({ product }: { product: any }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const images = product.images && product.images.length > 0
    ? product.images
    : product.image_url
      ? [{ url: product.image_url, is_primary: true }]
      : product.part_number
        ? [{ url: `/uploads/products/${product.part_number}.jpg`, is_primary: true }]
        : []

  const primaryImage = images[selectedImageIndex] || images[0]
  const brandName = product.brand?.name || product.manufacturer || product.brand
  const categoryName = product.category?.name || product.category

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % images.length)
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + images.length) % images.length)

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.part_number,
    description: product.description || product.short_description || `${brandName} ${product.part_number}`,
    sku: product.part_number,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    category: categoryName,
    image: images.map((img: any) => imageUrl(img.url)).filter(Boolean),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-10">
        <nav className="text-sm text-industrial-gray-500">
          <Link href="/" className="hover:text-industrial-green-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          {categoryName && (
            <>
              <Link href={`/search?category=${encodeURIComponent(categoryName)}`} className="hover:text-industrial-green-600 transition-colors">{categoryName}</Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-industrial-gray-900 font-medium">{product.part_number}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-industrial-gray-50 border-2 border-industrial-gray-200 rounded-xl overflow-hidden group">
              {primaryImage?.url ? (
                <Image
                  src={imageUrl(primaryImage.url)}
                  alt={product.name || product.part_number}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-28 h-28 text-industrial-gray-300" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="w-5 h-5 text-industrial-gray-700" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-industrial-gray-700" />
                  </button>
                </>
              )}
              <div className="absolute top-4 right-4">
                <span className={product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0 ? 'badge-in-stock' : 'badge-on-request'}>
                  {product.availability === 'available' || product.availability === 'in_stock' || (product.stock_quantity ?? 0) > 0 ? 'In Stock' : product.availability === 'limited' ? 'Limited' : 'Request Quote'}
                </span>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: any, idx: number) => (
                  <button
                    key={img.id ?? idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${selectedImageIndex === idx ? 'border-industrial-green-500 ring-2 ring-industrial-green-200' : 'border-industrial-gray-200 hover:border-industrial-gray-300'}`}
                  >
                    <Image src={imageUrl(img.url)} alt="" width={64} height={64} className="w-full h-full object-contain bg-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {brandName && (
              <Link href={`/brand/${encodeURIComponent(product.brand?.slug || brandName.toLowerCase().replace(/\s+/g, '-'))}`} className="text-sm font-semibold text-industrial-green-600 hover:text-industrial-green-700 hover:underline transition-colors">
                {brandName}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-industrial-gray-900 mt-1 font-mono tracking-tight">
              {product.part_number}
            </h1>
            {product.name && <p className="text-lg text-industrial-gray-600 mt-1">{product.name}</p>}
            {product.series && <p className="text-sm text-industrial-gray-500 mt-1">Series: <span className="font-medium text-industrial-gray-700">{product.series}</span></p>}
            {categoryName && <p className="text-sm text-industrial-gray-500 mt-0.5">Category: <span className="font-medium text-industrial-gray-700">{categoryName}</span></p>}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {product.price_usd != null && product.price_usd > 0 && (
                <div className="text-2xl font-bold text-industrial-gray-900">
                  ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              )}
              <Link href={`/rfq?part_number=${encodeURIComponent(product.part_number)}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-industrial-green-600 hover:bg-industrial-green-700 text-white font-semibold shadow-[0_4px_14px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] transition-all">
                <MessageCircle className="w-5 h-5" />
                Request Quote (RFQ)
              </Link>
              <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@advancedsystems-int.com'}?subject=RFQ%20${encodeURIComponent(product.part_number)}`} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-industrial-gray-200 hover:border-industrial-green-500 hover:bg-industrial-green-50 text-industrial-gray-700 font-medium transition-all">
                <ExternalLink className="w-4 h-4" />
                Email Quote
              </a>
            </div>

            {product.description && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-industrial-gray-900 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-industrial-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Datasheet Download */}
            {(product.datasheets?.length > 0 || product.datasheet_url || product.datasheet) && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-industrial-gray-900 uppercase tracking-wider mb-2">Datasheet</h3>
                <div className="flex flex-wrap gap-2">
                  {product.datasheets?.map((ds: any) => (
                    <a
                      key={ds.id}
                      href={imageUrl(ds.url)}
                      download={ds.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-industrial-gray-200 hover:border-industrial-green-500 hover:bg-industrial-green-50 transition-colors text-industrial-gray-700 font-medium"
                    >
                      <FileText className="w-5 h-5 text-industrial-green-600" />
                      {ds.name || 'Datasheet'}
                      <Download className="w-4 h-4" />
                    </a>
                  ))}
                  {(!product.datasheets || product.datasheets.length === 0) && (product.datasheet_url || product.datasheet) && (
                    <a
                      href={product.datasheet_url || product.datasheet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-industrial-gray-200 hover:border-industrial-green-500 hover:bg-industrial-green-50 transition-colors text-industrial-gray-700 font-medium"
                    >
                      <FileText className="w-5 h-5 text-industrial-green-600" />
                      Download Datasheet
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Table */}
        {(product.specs?.length > 0 || product.specifications) && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-industrial-gray-900 mb-4">Specifications</h2>
            <div className="border-2 border-industrial-gray-200 rounded-xl overflow-hidden shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-industrial-gray-50">
                    <th className="px-5 py-3 text-left font-semibold text-industrial-gray-700">Specification</th>
                    <th className="px-5 py-3 text-left font-semibold text-industrial-gray-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {product.specs?.map((s: any, i: number) => (
                    <tr key={s.id ?? i} className="border-t border-industrial-gray-100 even:bg-industrial-gray-50/50">
                      <td className="px-5 py-3 text-industrial-gray-600 font-medium">{s.key}</td>
                      <td className="px-5 py-3 text-industrial-gray-900">{s.value} {s.unit || ''}</td>
                    </tr>
                  ))}
                  {(!product.specs || product.specs.length === 0) && product.specifications && typeof product.specifications === 'object' && (
                    Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key} className="border-t border-industrial-gray-100 even:bg-industrial-gray-50/50">
                        <td className="px-5 py-3 text-industrial-gray-600 font-medium">{key}</td>
                        <td className="px-5 py-3 text-industrial-gray-900">{String(value)}</td>
                      </tr>
                    ))
                  )}
                  {(!product.specs || product.specs.length === 0) && typeof product.specifications === 'string' && (
                    <tr>
                      <td colSpan={2} className="px-5 py-4 text-industrial-gray-600">{product.specifications}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
