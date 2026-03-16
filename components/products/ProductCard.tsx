'use client'

import { memo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RFQButton } from '@/components/RFQButton'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { ProductImage } from '@/components/ui/ProductImage'

function KeySpecs({
  quickSpecs,
}: {
  quickSpecs: {
    series?: string
    voltage?: string
    current?: string
    coil_voltage?: string
    mounting_type?: string
  }
}) {
  const items: { label: string; value: string }[] = []
  if (quickSpecs.coil_voltage?.trim()) items.push({ label: 'Coil Voltage', value: quickSpecs.coil_voltage.trim() })
  else if (quickSpecs.voltage?.trim()) items.push({ label: 'Voltage', value: quickSpecs.voltage.trim() })
  if (quickSpecs.current?.trim()) items.push({ label: 'Current', value: quickSpecs.current.trim() })
  if (quickSpecs.mounting_type?.trim()) items.push({ label: 'Mounting', value: quickSpecs.mounting_type.trim() })
  if (!items.length && (quickSpecs.series?.trim() || quickSpecs.voltage?.trim() || quickSpecs.current?.trim())) {
    const fallback = [quickSpecs.series, quickSpecs.voltage, quickSpecs.current].filter(Boolean).join(' · ')
    if (fallback) items.push({ label: '', value: fallback })
  }
  if (!items.length) return null
  return (
    <ul className="mt-2 space-y-0.5" aria-label="Key specifications">
      {items.map(({ label, value }) =>
        label ? (
          <li key={label} className="text-xs text-gray-600 flex flex-wrap gap-x-1.5">
            <span className="text-gray-500 font-medium">{label}:</span>
            <span>{value}</span>
          </li>
        ) : (
          <li key="fallback" className="text-xs text-gray-500">{value}</li>
        )
      )}
    </ul>
  )
}

export interface ProductCardProps {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  stock_quantity?: number
  availability?: 'in_stock' | 'on_request'
  price_usd?: number | null
  /** Key specs for search results – displayed under title as labeled lines */
  quickSpecs?: {
    series?: string
    voltage?: string
    current?: string
    coil_voltage?: string
    mounting_type?: string
  }
  /** RS/Siemens-style compact card for grids */
  variant?: 'default' | 'compact'
  /** Base path for product links */
  productBasePath?: string
}

function ProductCardInner({
  part_number,
  brand,
  manufacturer,
  category,
  description,
  image_url,
  stock_quantity = 0,
  availability = 'on_request',
  price_usd,
  quickSpecs,
  variant = 'default',
  productBasePath = '/part-number',
}: ProductCardProps) {
  const { format } = useCurrency()
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'
  const maker = brand ?? manufacturer ?? '—'

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={
        compact
          ? 'group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200'
          : 'group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-soft hover:shadow-card hover:border-gray-300 transition-all duration-200'
      }
    >
      <Link
        href={`${productBasePath}/${encodeURIComponent(part_number)}`}
        className={`block relative bg-gray-50 overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}
      >
        <div className="absolute inset-0">
          <ProductImage
            partNumber={part_number}
            alt={`${maker} ${part_number}`}
            variant="card"
            className="group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>
        <div className="absolute top-2 right-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-50 text-accent-700 border border-accent-200">
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              On Request
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'p-3 flex flex-col flex-1' : 'p-4 flex flex-col flex-1'}>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          {maker}
        </p>
        <Link href={`${productBasePath}/${encodeURIComponent(part_number)}`}>
          <h3 className="font-mono font-semibold text-base text-gray-900 group-hover:text-accent-600 transition-colors leading-snug mt-0.5 break-all">
            {part_number}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{category ?? 'Industrial Component'}</p>
        {quickSpecs && (
          <KeySpecs quickSpecs={quickSpecs} />
        )}
        {!compact && description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1 mt-1">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-gray-100">
          <Link
            href={`${productBasePath}/${encodeURIComponent(part_number)}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white transition-colors flex-1"
          >
            View Product
          </Link>
          <RFQButton partNumber={part_number} variant="sm" />
        </div>
      </div>
    </motion.div>
  )
}

export const ProductCard = memo(ProductCardInner)
