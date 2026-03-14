'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Package, Eye } from 'lucide-react'
import { useCurrency } from '@/lib/hooks/useCurrency'

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
  /** RS/Octopart-style compact card for grids */
  variant?: 'default' | 'compact'
  /** Base path for product links (e.g. /part-number for SEO pages) */
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
  productBasePath = '/part-number',
}: ProductCardProps) {
  const { format } = useCurrency()
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'

  return (
    <div className={compact
      ? "group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all"
      : "group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
    }>
      <Link href={`${productBasePath}/${encodeURIComponent(part_number)}`} className={`block relative bg-slate-50 overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {image_url ? (
          <Image
            src={image_url}
            alt={`${manufacturer || ''} ${part_number}`}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {inStock ? (
            <span className="badge-in-stock">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="badge-on-request">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              On Request
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? "p-3 flex flex-col flex-1" : "p-4 flex flex-col flex-1"}>
        {(manufacturer || category) && (
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
            {manufacturer && <span className="font-medium text-primary-600">{manufacturer}</span>}
            {manufacturer && category && <span>·</span>}
            {category && <span>{category}</span>}
          </div>
        )}
        <Link href={`${productBasePath}/${encodeURIComponent(part_number)}`}>
          <h3 className="font-mono font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors leading-snug">
            {part_number}
          </h3>
        </Link>
        {quickSpecs && (quickSpecs.series || quickSpecs.voltage || quickSpecs.current) && (
          <p className="text-xs text-slate-500 mt-1">
            {[quickSpecs.series, quickSpecs.voltage, quickSpecs.current].filter(Boolean).join(" · ")}
          </p>
        )}
        {!compact && description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1 mt-1">
            {description}
          </p>
        )}

        <div className={`flex items-center justify-between gap-2 pt-3 border-t border-slate-100 ${compact ? 'mt-auto' : ''}`}>
          <div className="text-sm font-semibold text-gray-900">
            {price_usd ? format(price_usd) : <span className="text-gray-500 text-xs font-medium">Quote Available</span>}
          </div>
          <div className="flex gap-2">
            <Link
              href={`${productBasePath}/${encodeURIComponent(part_number)}`}
              className={compact
                ? "text-xs font-medium text-primary-600 hover:text-primary-700"
                : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              }
            >
              View
            </Link>
            <Link
              href={`/rfq?part_number=${encodeURIComponent(part_number)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-primary-600 border border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FileText className="w-3 h-3" />
              RFQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProductCard = memo(ProductCardInner)
