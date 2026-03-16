'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { RFQButton } from '@/components/RFQButton'
import { whatsappHref, seriesToSlug } from '@/app/lib/constants'
import { resolveBrandImage } from '@/lib/imageResolver'
import { ProductImage } from '@/components/ui/ProductImage'

export interface ProductHeroProduct {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  series?: string
  availability?: string
  image_url?: string
  images?: string[]
  description?: string
  specifications?: Record<string, unknown> | null
  voltage?: string
  current?: string
  mounting_type?: string
}

export interface ProductHeroProps {
  product: ProductHeroProduct
  imageSrc: string
  imageAlt?: string
  apiBase: string
  datasheetUrl?: string | null
  productBasePath?: string
  categoryHref?: string | null
}

function getSpec(
  specs: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  if (!specs || typeof specs !== 'object') return '—'
  for (const k of keys) {
    const v = specs[k] ?? specs[k.toLowerCase()]
    if (v != null && String(v).trim()) return String(v)
  }
  return '—'
}

const KEY_SPECS = [
  { label: 'Voltage', keys: ['voltage', 'supply_voltage', 'rated_voltage', 'operating_voltage'] },
  { label: 'Current', keys: ['current', 'rated_current', 'current_rating', 'nominal_current'] },
  { label: 'Mounting Type', keys: ['mounting_type', 'mounting', 'mount_type'] },
  { label: 'Output Type', keys: ['output_type', 'output'] },
  { label: 'Protection Rating', keys: ['protection_rating', 'protection', 'ip_rating', 'enclosure_rating'] },
  { label: 'Series', keys: ['series'] },
]

export function ProductHero({
  product,
  imageSrc,
  imageAlt,
  apiBase,
  datasheetUrl,
  productBasePath = '/part-number',
  categoryHref,
}: ProductHeroProps) {
  const partNumber = product.part_number ?? ''
  const brand = product.brand ?? product.manufacturer ?? ''
  const category = product.category ?? ''
  const series = product.series ?? ''
  const isInStock = product.availability === 'in_stock' || product.availability === 'available'
  const specs = product.specifications ?? {}
  const seriesVal = product.series || getSpec(specs, 'series')

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
    >
      {/* Left: Product image — tries /uploads/products/{part_number}.jpg, .png, .webp then placeholder */}
      <div className="max-w-[520px] mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="relative w-full aspect-square max-h-[420px] mx-auto">
          <ProductImage
            partNumber={partNumber}
            alt={imageAlt ?? `${partNumber} product`}
            variant="hero"
            priority
          />
        </div>
      </div>

      {/* Right: Brand, title, metadata, actions, description, specs */}
      <div className="flex flex-col">
        {/* Brand logo above title */}
        {brand && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveBrandImage(brand, 'default')}
              alt={brand}
              className="h-8 w-auto mb-3 object-contain max-w-[140px]"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/brand-placeholder.png' }}
            />
          </div>
        )}

        {/* Product title */}
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 font-mono">
          {partNumber}
        </h1>

        {/* Metadata row: Brand, Category, Status */}
        <div className="mt-3 flex flex-wrap gap-4 items-center text-sm text-gray-500">
          {brand && (
            <span>
              <span className="font-medium text-gray-600">Brand:</span> {brand}
            </span>
          )}
          {category && (
            <span>
              <span className="font-medium text-gray-600">Category:</span>{' '}
              {categoryHref ? (
                <Link href={categoryHref} className="text-blue-600 hover:underline">{category}</Link>
              ) : (
                category
              )}
            </span>
          )}
          <span>
            <span className="font-medium text-gray-600">Status:</span>{' '}
            <span className={isInStock ? 'text-green-600' : 'text-amber-600'}>
              {isInStock ? 'In Stock' : 'On Request'}
            </span>
          </span>
          {series && (
            <span>
              <span className="font-medium text-gray-600">Series:</span>{' '}
              <Link href={`/series/${seriesToSlug(series)}`} className="text-blue-600 hover:underline">{series}</Link>
            </span>
          )}
        </div>

        {/* Description block - under title area */}
        {product.description && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-900">Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <RFQButton
            partNumber={partNumber}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-base"
          />
          <a
            href={whatsappHref(partNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            WhatsApp
          </a>
          {datasheetUrl && (
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Datasheet
            </a>
          )}
        </div>

        {/* Key specifications */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Key specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {KEY_SPECS.map((item) => {
              const value = item.label === 'Series' ? seriesVal : getSpec(specs, ...item.keys)
              return (
                <div
                  key={item.label}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                  <p className="mt-1 text-gray-900 font-medium truncate" title={String(value)}>{value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
