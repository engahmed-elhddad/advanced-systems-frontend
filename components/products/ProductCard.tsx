'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RFQButton } from '@/components/RFQButton'
import { useCurrency } from '@/lib/hooks/useCurrency'

const PLACEHOLDER_IMAGE = '/products/no-product-image.jpg'

export interface ProductCardProps {
  part_number: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  stock_quantity?: number
  availability?: 'in_stock' | 'on_request'
  price_usd?: number | null
  /** Quick specs for search results */
  quickSpecs?: { series?: string; voltage?: string; current?: string }
  /** RS/Siemens-style compact card for grids */
  variant?: 'default' | 'compact'
  /** Base path for product links */
  productBasePath?: string
}

function ProductCardInner({
  part_number,
  manufacturer,
  category,
  description,
  image_url,
  stock_quantity = 0,
  availability = 'on_request',
  price_usd,
  quickSpecs,
  variant = 'default',
  productBasePath = '/product',
}: ProductCardProps) {
  const { format } = useCurrency()
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={
        compact
          ? 'group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-accent-300 hover:shadow-md transition-all duration-200'
          : 'group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft hover:shadow-card hover:border-accent-300 transition-all duration-200'
      }
    >
      <Link
        href={`${productBasePath}/${encodeURIComponent(part_number)}`}
        className={`block relative bg-slate-50 overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}
      >
        {image_url && image_url !== PLACEHOLDER_IMAGE ? (
          <Image
            src={image_url}
            alt={`${manufacturer || ''} ${part_number}`}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={PLACEHOLDER_IMAGE}
            alt="No product image"
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        <div className="absolute top-2 right-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-50 text-accent-700 border border-accent-200">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              On Request
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'p-3 flex flex-col flex-1' : 'p-4 flex flex-col flex-1'}>
        {manufacturer && (
          <span className="text-xs font-medium text-accent-600 uppercase tracking-wider">
            {manufacturer}
          </span>
        )}
        <Link href={`${productBasePath}/${encodeURIComponent(part_number)}`}>
          <h3 className="font-mono font-bold text-slate-900 text-sm group-hover:text-accent-600 transition-colors leading-snug mt-0.5">
            {part_number}
          </h3>
        </Link>
        {category && (
          <p className="text-xs text-slate-500 mt-0.5">{category}</p>
        )}
        {quickSpecs && (quickSpecs.series || quickSpecs.voltage || quickSpecs.current) && (
          <p className="text-xs text-slate-500 mt-1">
            {[quickSpecs.series, quickSpecs.voltage, quickSpecs.current].filter(Boolean).join(' · ')}
          </p>
        )}
        {!compact && description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 flex-1 mt-1">
            {description}
          </p>
        )}

        <div
          className={`flex items-center justify-between gap-2 pt-3 mt-auto border-t border-slate-100`}
        >
          <div className="text-sm font-semibold text-slate-900">
            {price_usd ? (
              format(price_usd)
            ) : (
              <span className="text-slate-500 text-xs font-medium">Quote Available</span>
            )}
          </div>
          <RFQButton partNumber={part_number} variant="sm" />
        </div>
      </div>
    </motion.div>
  )
}

export const ProductCard = memo(ProductCardInner)
