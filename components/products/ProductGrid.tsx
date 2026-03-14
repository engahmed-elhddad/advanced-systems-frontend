'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import type { ProductCardProps } from './ProductCard'

export interface ProductGridProps {
  products: Array<Record<string, unknown>>
  productBasePath?: string
  /** Columns: desktop=5, tablet=3, mobile=2 */
  columns?: 'default' | 'compact'
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function ProductGridInner({
  products,
  productBasePath = '/product',
  columns = 'default',
}: ProductGridProps) {
  return (
    <motion.div
      className={`grid gap-4 sm:gap-5 ${
        columns === 'compact'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      }`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {products.map((p, idx) => {
        const props = productToCardProps(p as Parameters<typeof productToCardProps>[0])
        return (
          <motion.div key={props.part_number + String(idx)} variants={item}>
            <ProductCard
              {...props}
              productBasePath={productBasePath}
              variant="compact"
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export const ProductGrid = memo(ProductGridInner)
