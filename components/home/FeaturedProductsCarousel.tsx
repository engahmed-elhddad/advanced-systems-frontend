'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { API_BASE_URL } from '@/app/lib/constants'
import { resolveProductImage } from '@/lib/imageResolver'

const PRODUCT_PLACEHOLDER = '/images/product-placeholder.png'

interface ProductRow {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  images?: string[]
}

async function fetchFeatured(): Promise<ProductRow[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/featured?limit=20`)
    if (!res.ok) throw new Error('Featured failed')
    const data = await res.json()
    const list = data?.products ?? data?.results ?? []
    if (Array.isArray(list) && list.length > 0) return list
  } catch {
    // fallback
  }
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=20`)
    if (!res.ok) return []
    const data = await res.json()
    return data?.products ?? data?.results ?? []
  } catch {
    return []
  }
}

function ProductCard({ p }: { p: ProductRow }) {
  const imgUrl = p.image_url ?? (Array.isArray(p.images) && p.images[0] ? (p.images[0] as string) : null) ?? resolveProductImage(p.part_number)
  const [imgSrc, setImgSrc] = useState(imgUrl)
  const partSlug = encodeURIComponent(p.part_number)
  const rfqHref = `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eng.ahmed@advancedsystems-int.com'}?subject=RFQ%20${encodeURIComponent(p.part_number)}`

  return (
    <div className="min-w-[220px] flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 transition hover:scale-[1.02] hover:shadow-md">
      <Link href={`/part-number/${partSlug}`} className="block">
        <div className="flex h-28 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={p.part_number}
            onError={() => setImgSrc(PRODUCT_PLACEHOLDER)}
            className="h-28 w-full object-contain"
          />
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-semibold text-gray-900">
          {p.part_number}
        </p>
        <p className="text-xs text-gray-500">
          {(p.brand ?? p.manufacturer) || '—'}
        </p>
      </Link>
      <a
        href={rfqHref}
        className="mt-3 inline-block rounded bg-blue-600 px-3 py-1 text-xs text-white transition hover:bg-blue-700"
      >
        RFQ
      </a>
    </div>
  )
}

export function FeaturedProductsCarousel() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchFeatured().then((list) => {
      if (!cancelled) setProducts(list)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const step = 240
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Featured Products</h2>
          <div className="flex gap-6 overflow-hidden py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 min-w-[220px] flex-shrink-0 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Featured Products</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-gray-50"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-gray-50"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto py-6 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((p) => (
              <ProductCard key={p.part_number} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
