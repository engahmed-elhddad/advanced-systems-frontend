'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, MessageCircle, Package } from 'lucide-react'
import { RFQButton } from '@/components/RFQButton'
import { whatsappHref } from '@/app/lib/constants'

export interface ProductHeroProduct {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
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
  const isInStock = product.availability === 'in_stock'
  const showPlaceholder = !imageSrc || imageSrc === '/products/no-product-image.jpg'

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
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-300" />
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt ?? partNumber}
              fill
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized={imageSrc.startsWith('http') && !imageSrc.includes(apiBase)}
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <RFQButton partNumber={partNumber} variant="default" />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href={whatsappHref(partNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-700 font-medium text-sm shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </motion.div>
            {datasheetUrl && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href={datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-700 font-medium text-sm shadow-sm transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Datasheet
                </a>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
