'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

export interface RelatedProductItem {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  image_url?: string
  images?: string[]
}

export interface RelatedProductsProps {
  products: RelatedProductItem[]
  productBasePath?: string
  imageUrl: (item: RelatedProductItem) => string
  title?: string
  className?: string
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25 },
  }),
}

export function RelatedProducts({
  products,
  productBasePath = '/part-number',
  imageUrl,
  title = 'Related Products',
  className = '',
}: RelatedProductsProps) {
  if (!products?.length) return null

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((item, i) => {
          const href = `${productBasePath}/${encodeURIComponent(item.part_number)}`
          const imgSrc = imageUrl(item)
          const showPlaceholder =
            !imgSrc || imgSrc === '/products/no-product-image.jpg'
          const brand = item.brand ?? item.manufacturer ?? ''

          return (
            <motion.div
              key={item.part_number}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href={href} className="block group">
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-md hover:shadow-lg hover:border-blue-100 transition-all h-full"
                >
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                    {showPlaceholder ? (
                      <Package className="w-12 h-12 text-gray-300" />
                    ) : (
                      <Image
                        src={imgSrc}
                        alt={item.part_number}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized={imgSrc.startsWith('http')}
                      />
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <p className="font-mono font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                      {item.part_number}
                    </p>
                    {brand && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {brand}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
