'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SafeImage } from '@/components/common/SafeImage'

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

function RelatedProductCard({
  item,
  href,
  brand,
  index,
  imageUrl,
}: {
  item: RelatedProductItem
  href: string
  brand: string
  index: number
  imageUrl: string
}) {
  return (
    <motion.div
      key={item.part_number}
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Link href={href} className="block group">
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md hover:shadow-lg hover:border-slate-300 transition-all h-full"
        >
          <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-4">
            <SafeImage
              src={imageUrl}
              alt={item.part_number}
              className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="border-t border-slate-100 p-4">
            <p className="font-mono font-semibold text-slate-900 text-sm truncate group-hover:text-[#0B1F3A] transition-colors">
              {item.part_number}
            </p>
            {brand && (
              <p className="mt-1 text-xs text-slate-500 truncate">
                {brand}
              </p>
            )}
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7A00]">
              Request Quote <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
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
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">{title}</h2>
        <p className="text-sm text-slate-500">Sourcing alternatives and adjacent inventory</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {products.slice(0, 8).map((item, i) => {
          const href = `${productBasePath}/${encodeURIComponent(item.part_number)}`
          const imgSrc = imageUrl(item)
          const brand = item.brand ?? item.manufacturer ?? ''
          return (
            <RelatedProductCard
              key={item.part_number}
              item={item}
              href={href}
              brand={brand}
              index={i}
              imageUrl={imgSrc}
            />
          )
        })}
      </div>
    </section>
  )
}
