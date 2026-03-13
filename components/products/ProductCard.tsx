'use client'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Package } from 'lucide-react'
import clsx from 'clsx'
import { useCurrency } from '@/lib/hooks/useCurrency'

interface ProductCardProps {
  part_number: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  stock_quantity?: number
  availability?: 'in_stock' | 'on_request'
  price_usd?: number | null
}

export function ProductCard({
  part_number,
  manufacturer,
  category,
  description,
  image_url,
  stock_quantity = 0,
  availability = 'on_request',
  price_usd,
}: ProductCardProps) {
  const { format } = useCurrency()
  const inStock = availability === 'in_stock' || stock_quantity > 0

  return (
    <div className="card card-hover group flex flex-col">
      <Link href={`/product/${encodeURIComponent(part_number)}`} className="block relative aspect-[4/3] bg-gray-50 overflow-hidden">
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

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          {(manufacturer || category) && (
            <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
              {manufacturer && <span className="font-medium text-primary-600">{manufacturer}</span>}
              {manufacturer && category && <span>·</span>}
              {category && <span>{category}</span>}
            </div>
          )}
          <Link href={`/product/${encodeURIComponent(part_number)}`}>
            <h3 className="font-mono font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors leading-snug mb-1.5">
              {part_number}
            </h3>
          </Link>
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="text-sm font-semibold text-gray-900">
            {price_usd ? format(price_usd) : <span className="text-gray-500 text-xs font-medium">Quote Available</span>}
          </div>
          <Link
            href={`/rfq?part_number=${encodeURIComponent(part_number)}`}
            className="btn-outline py-1.5 px-3 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            RFQ
          </Link>
        </div>
      </div>
    </div>
  )
}
