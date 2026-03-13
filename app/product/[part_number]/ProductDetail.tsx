'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FileText, Download, Package, MessageCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

export function ProductDetail({ product }: { product: any }) {
  const primaryImage = product.images?.find((i: any) => i.is_primary) || product.images?.[0]
  const brandName = product.brand?.name
  const categoryName = product.category?.name

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <span className="mx-2">/</span>
        {categoryName && (
          <>
            <Link href={`/category/${encodeURIComponent(product.category?.slug || categoryName)}`} className="hover:text-primary-600 transition-colors">{categoryName}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{product.part_number}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
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
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <span className={product.availability === 'available' || product.availability === 'in_stock' ? 'badge-in-stock' : 'badge-on-request'}>
                {product.availability === 'available' || product.availability === 'in_stock' ? 'In Stock' : product.availability === 'limited' ? 'Limited' : 'Request Quote'}
              </span>
            </div>
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img: any) => (
                <button key={img.id} className="shrink-0 w-16 h-16 rounded-lg border border-gray-200 overflow-hidden hover:border-primary-500 transition-colors">
                  <Image src={imageUrl(img.url)} alt="" width={64} height={64} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {brandName && (
            <Link href={`/brand/${encodeURIComponent(product.brand?.slug || brandName)}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors">
              {brandName}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
            {product.part_number}
          </h1>
          {product.name && <p className="text-gray-600 mt-1">{product.name}</p>}
          {product.series && <p className="text-sm text-gray-500 mt-1">Series: {product.series}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {product.price_usd != null && (
              <div className="text-2xl font-bold text-gray-900">
                ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            )}
            <Link
              href={`/rfq?part_number=${encodeURIComponent(product.part_number)}`}
              className="btn-primary"
            >
              <MessageCircle className="w-4 h-4" />
              Request Quote
            </Link>
          </div>

          {product.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.datasheets?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Datasheets</h3>
              <div className="flex flex-wrap gap-2">
                {product.datasheets.map((ds: any) => (
                  <a
                    key={ds.id}
                    href={imageUrl(ds.url)}
                    download={ds.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors text-sm text-gray-700"
                  >
                    <FileText className="w-4 h-4 text-primary-600" />
                    {ds.name}
                    <Download className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.specs?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-soft">
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((s: any, i: number) => (
                  <tr key={s.id ?? i} className="border-b border-gray-100 last:border-0 even:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-medium">{s.key}</td>
                    <td className="px-4 py-3 text-gray-900">{s.value} {s.unit || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
