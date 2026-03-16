'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { productToCardProps } from '@/lib/productMappers'
import { getFeaturedFromApi } from '@/lib/api'

const CARD_MIN_WIDTH = 280

export function AutoProductCarousel() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    getFeaturedFromApi(16)
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setProducts(list)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!products.length) return null

  const cardPropsList = products.map((p: any) => productToCardProps(p))

  return (
    <section>
      <SectionHeader
        title="Trending Industrial Components"
        viewAllHref="/products"
        viewAllLabel="View all products"
      />
      <div className="overflow-hidden relative w-full">
        <div
          className="flex gap-6 animate-scroll hover:[animation-play-state:paused]"
          style={{ width: 'max-content' }}
        >
          {cardPropsList.map((props, idx) => (
            <div
              key={`a-${props.part_number}-${idx}`}
              className="flex-shrink-0"
              style={{ minWidth: CARD_MIN_WIDTH }}
            >
              <ProductCard
                {...props}
                productBasePath="/part-number"
              />
            </div>
          ))}
          {cardPropsList.map((props, idx) => (
            <div
              key={`b-${props.part_number}-${idx}`}
              className="flex-shrink-0"
              style={{ minWidth: CARD_MIN_WIDTH }}
            >
              <ProductCard
                {...props}
                productBasePath="/part-number"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
