'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { API_BASE_URL } from '@/lib/constants'
import { SafeImage } from '@/components/ui/SafeImage'

interface ProductRow {
  part_number: string
  slug?: string
  brand?: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  images?: string[]
}

async function fetchFeatured(): Promise<ProductRow[]> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/products/featured?limit=20`)
    if (!res.ok) throw new Error('Featured failed')
    const data = await res.json()
    const list = data?.products ?? data?.results ?? []
    if (Array.isArray(list) && list.length > 0) return list
  } catch {
    // fallback
  }
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/products/?page=1&size=20&is_featured=true`)
    if (res.ok) {
      const data = await res.json()
      const items = data?.items ?? []
      if (Array.isArray(items) && items.length > 0) return items as ProductRow[]
    }
  } catch {
    /* */
  }
  try {
    const res = await apiFetch(`${API_BASE_URL}/products?limit=20`)
    if (!res.ok) return []
    const data = await res.json()
    return data?.products ?? data?.results ?? []
  } catch {
    return []
  }
}

function ProductCard({ p }: { p: ProductRow }) {
  const partSlug = encodeURIComponent((p.slug || p.part_number).trim())
  const rfqHref = `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'eng.ahmed@advancedsystems-int.com'}?subject=RFQ%20${encodeURIComponent(p.part_number)}`

  return (
    <div className="min-w-[220px] flex-shrink-0 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-orange-400/25 hover:shadow-[0_0_28px_rgba(139,92,246,0.1)]">
      <Link href={`/products/${partSlug}`} className="block">
        <div className="flex h-28 items-center justify-center rounded-lg border border-white/5 bg-white/[0.04]">
          <SafeImage src={p.image_url} alt={p.part_number} className="h-28 w-full object-contain" />
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-semibold text-white">{p.part_number}</p>
        <p className="text-xs text-white/50">{(p.brand ?? p.manufacturer) || '—'}</p>
      </Link>
      <a
        href={rfqHref}
        className="mt-3 inline-block rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-orange-500/25 transition-all duration-300 hover:brightness-110"
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
    return () => {
      cancelled = true
    }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const step = 240
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Featured products</h2>
          <div className="flex gap-6 overflow-hidden py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 min-w-[220px] flex-shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Featured products</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-2.5 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-orange-400/30 hover:bg-white/[0.14]"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-2.5 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-orange-400/30 hover:bg-white/[0.14]"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
