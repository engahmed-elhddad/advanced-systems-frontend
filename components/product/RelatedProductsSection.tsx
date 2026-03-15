'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { API_BASE_URL } from '@/app/lib/constants'

export interface RelatedProductsSectionProps {
  partNumber: string
  apiBase?: string
  productBasePath?: string
  title?: string
  className?: string
}

interface SuggestionItem {
  part_number: string
  manufacturer?: string
  category?: string
  images?: string[]
}

export function RelatedProductsSection({
  partNumber,
  apiBase = API_BASE_URL,
  productBasePath = '/product',
  title = 'Related Products',
  className = '',
}: RelatedProductsSectionProps) {
  const [products, setProducts] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!partNumber?.trim()) {
      setLoading(false)
      return
    }
    setLoading(true)
    const url = `${apiBase.replace(/\/$/, '')}/product/${encodeURIComponent(partNumber)}/related-suggestions?limit=8`
    fetch(url)
      .then((r) => r.json())
      .then((data: { suggestions?: SuggestionItem[] }) => {
        const list = Array.isArray(data.suggestions) ? data.suggestions : []
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [partNumber, apiBase])

  if (loading) {
    return (
      <section className={className}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-40 h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </section>
    )
  }

  const items = products.map((p) => ({
    part_number: p.part_number,
    brand: p.manufacturer,
    manufacturer: p.manufacturer,
    category: p.category,
    image_url: Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined,
    images: p.images,
  }))

  const imageUrl = (item: { image_url?: string; images?: string[] }) => {
    const u = item.image_url ?? item.images?.[0]
    if (!u) return '/images/product-placeholder.png'
    return u.startsWith('http') ? u : u
  }

  if (!items.length) return null

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
        <div className="flex gap-4 min-w-0" style={{ width: 'max-content' }}>
          {items.map((item) => {
            const href = `${productBasePath}/${encodeURIComponent(item.part_number)}`
            const imgSrc = imageUrl(item)
            const showPlaceholder = !imgSrc || imgSrc === '/products/no-product-image.jpg'
            const brand = item.brand ?? item.manufacturer ?? ''

            return (
              <Link
                key={item.part_number}
                href={href}
                className="shrink-0 w-40 sm:w-44 block group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-md hover:shadow-lg hover:border-accent-200 transition-all"
              >
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                  {showPlaceholder ? (
                    <Package className="w-12 h-12 text-gray-300" />
                  ) : (
                    <Image
                      src={imgSrc}
                      alt={item.part_number}
                      width={176}
                      height={176}
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      unoptimized={imgSrc.startsWith('http')}
                    />
                  )}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <p className="font-mono font-semibold text-gray-900 text-sm truncate group-hover:text-accent-600 transition-colors">
                    {item.part_number}
                  </p>
                  {brand && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{brand}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
