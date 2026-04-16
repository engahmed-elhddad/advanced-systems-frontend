'use client'

import { memo } from 'react'
import { ProductCard } from './ProductCard'
import {
  ormProductToApiProduct,
  productToCardProps,
  searchHitToApiProduct,
} from '@/lib/productMappers'

function recordToCardProps(p: Record<string, unknown>) {
  if (
    'brand_name' in p ||
    'category_name' in p ||
    ('primary_image' in p && p.primary_image !== undefined)
  ) {
    return productToCardProps(searchHitToApiProduct(p))
  }
  return productToCardProps(ormProductToApiProduct(p))
}

export interface ProductGridProps {
  products: Array<Record<string, unknown>>
  productBasePath?: string
  columns?: 'default' | 'compact'
}

function ProductGridInner({
  products,
  productBasePath = '/products',
  columns = 'default',
}: ProductGridProps) {
  return (
    <div
      className={`grid gap-4 sm:gap-5 ${
        columns === 'compact'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      }`}
    >
      {products.map((p, idx) => {
        const props = recordToCardProps(p as Record<string, unknown>)
        return (
          <div
            key={props.part_number + String(idx)}
            className="animate-fadeIn"
            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
          >
            <ProductCard
              {...props}
              productBasePath={productBasePath}
              variant="compact"
            />
          </div>
        )
      })}
    </div>
  )
}

export const ProductGrid = memo(ProductGridInner)
