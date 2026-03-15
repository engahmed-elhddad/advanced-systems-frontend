'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Package, Download } from 'lucide-react'
import { RFQButton } from '@/components/RFQButton'
import { whatsappHref, seriesToSlug } from '@/app/lib/constants'

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
}

export interface ProductHeroProps {
  product: ProductHeroProduct
  imageSrc: string
  imageAlt?: string
  apiBase: string
  datasheetUrl?: string | null
  productBasePath?: string
  /** Optional href for category link (e.g. /category/plc or /search?category=PLC) */
  categoryHref?: string | null
}

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
  const [imgError, setImgError] = useState(false)
  const showPlaceholder = !imageSrc || imageSrc.endsWith('/images/product-placeholder.png') || imgError

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid lg:grid-cols-2 gap-8 lg:gap-12"
    >
      {/* Left: Product image with zoom / hover */}
      <div className="relative group">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-md"
        >
          {showPlaceholder ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Package className="w-24 h-24 text-gray-300" aria-hidden />
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt ?? `${partNumber} product`}
              fill
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized={imageSrc.startsWith('http')}
              onError={() => setImgError(true)}
            />
          )}
        </motion.div>
      </div>

      {/* Right: Part number, brand, category, availability, actions */}
      <div className="flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="space-y-5"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-tight">
              {partNumber}
            </h1>
            {brand && (
              <p className="mt-2 text-sm font-medium text-gray-600">{brand}</p>
            )}
            {category && (
              categoryHref ? (
                <Link
                  href={categoryHref}
                  className="mt-1 inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {category}
                </Link>
              ) : (
                <span className="mt-1 inline-block text-sm text-gray-600">{category}</span>
              )
            )}
            {series && (
              <p className="mt-1 text-sm text-gray-500">
                Series: <Link href={`/series/${seriesToSlug(series)}`} className="font-medium text-accent-600 hover:underline">{series}</Link>
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isInStock
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isInStock ? 'bg-green-500' : 'bg-amber-500'}`}
              />
              {isInStock ? 'In stock' : 'On request'}
            </span>
          </div>

          {/* Action buttons: Request Quote, WhatsApp, Datasheet */}
          <div className="flex flex-wrap gap-3 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <RFQButton partNumber={partNumber} variant="default" />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href={whatsappHref(partNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-accent-300 hover:text-accent-700 font-medium text-sm shadow-sm transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                WhatsApp
              </a>
            </motion.div>
            {datasheetUrl && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href={datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Datasheet
                </a>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
