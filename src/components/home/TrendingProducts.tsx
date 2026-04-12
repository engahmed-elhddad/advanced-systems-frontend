'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'
import { API_BASE_URL } from '@/lib/constants'

const CARD_MIN_WIDTH = 280

export function TrendingProducts() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const apply = (data: Record<string, unknown>) => {
      const list = (data?.items ?? data?.products ?? data?.results ?? []) as unknown[]
      setProducts(Array.isArray(list) ? (list as Record<string, unknown>[]) : [])
    }
    apiFetch(`${API_BASE_URL}/api/v1/products/?page=1&size=12`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('v1 products'))))
      .then((data) => {
        if (cancelled) return
        apply(data as Record<string, unknown>)
      })
      .catch(() =>
        apiFetch(`${API_BASE_URL}/products?limit=12`)
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return
            apply(data as Record<string, unknown>)
          })
      )
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Trending components</h2>
          <div className="flex gap-6 overflow-hidden py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 min-w-[280px] flex-shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  const cardPropsList = products.map((p) => productToCardProps(p as never))

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Trending components</h2>
        <div className="w-full overflow-hidden">
          <div
            className="flex animate-scroll gap-6 hover:[animation-play-state:paused]"
            style={{ width: 'max-content' }}
          >
            {cardPropsList.map((props, idx) => (
              <div key={`${props.part_number}-${idx}`} className="flex-shrink-0" style={{ minWidth: CARD_MIN_WIDTH }}>
                <ProductCard {...props} productBasePath="/products" />
              </div>
            ))}
            {cardPropsList.map((props, idx) => (
              <div key={`dup-${props.part_number}-${idx}`} className="flex-shrink-0" style={{ minWidth: CARD_MIN_WIDTH }}>
                <ProductCard {...props} productBasePath="/products" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
