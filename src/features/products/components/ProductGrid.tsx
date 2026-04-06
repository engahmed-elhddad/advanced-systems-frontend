'use client'

import type { ProductListItem } from '@/types/product'
import { ProductCard } from './ProductCard'

export interface ProductGridProps {
  products: ProductListItem[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={`${product.part_number}-${index}`}
          part_number={product.part_number}
          brand={product.brand}
          category={product.category}
          description={product.description}
          image_url={product.image_url}
        />
      ))}
    </section>
  )
}
