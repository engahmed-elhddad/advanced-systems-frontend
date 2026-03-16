'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import { API_BASE_URL } from '@/app/lib/constants'

const CARD_MIN_WIDTH = 280

export function TrendingProducts() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/products?limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = data?.products ?? data?.results ?? []
        setProducts(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Trending Industrial Components</h2>
          <div className="flex gap-6 overflow-hidden py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 min-w-[280px] flex-shrink-0 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  const cardPropsList = products.map((p) => productToCardProps(p as never))

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Trending Industrial Components</h2>
        <div className="overflow-hidden w-full">
          <div
            className="flex gap-6 animate-scroll hover:[animation-play-state:paused]"
            style={{ width: 'max-content' }}
          >
            {cardPropsList.map((props, idx) => (
              <div
                key={`${props.part_number}-${idx}`}
                className="flex-shrink-0"
                style={{ minWidth: CARD_MIN_WIDTH }}
              >
                <ProductCard {...props} productBasePath="/part-number" />
              </div>
            ))}
            {cardPropsList.map((props, idx) => (
              <div
                key={`dup-${props.part_number}-${idx}`}
                className="flex-shrink-0"
                style={{ minWidth: CARD_MIN_WIDTH }}
              >
                <ProductCard {...props} productBasePath="/part-number" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
