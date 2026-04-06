'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkles, PackageSearch } from 'lucide-react'
import { getProducts } from '@/lib/api'

type ProductHit = {
  part_number: string
  name?: string
  brand?: string
  category?: string
  description?: string
  image_url?: string
}

type RecommendationSectionsProps = {
  currentPartNumber: string
  brandName: string
  categoryName: string
  keywordSeed: string
}

function scoreProduct(item: ProductHit, keywordSeed: string, brandName: string, categoryName: string): number {
  const hay = `${item.part_number} ${item.name || ''} ${item.brand || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase()
  const tokens = keywordSeed
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
  let score = 0
  for (const token of tokens) {
    if (hay.includes(token)) score += 2
  }
  if ((item.brand || '').toLowerCase() === brandName.toLowerCase()) score += 5
  if ((item.category || '').toLowerCase() === categoryName.toLowerCase()) score += 4
  return score
}

function ProductList({
  title,
  icon,
  products,
}: {
  title: string
  icon: React.ReactNode
  products: ProductHit[]
}) {
  if (!products.length) return null
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
        {icon}
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((item) => (
          <Link
            key={item.part_number}
            href={`/products/${encodeURIComponent(item.part_number)}`}
            className="group rounded-lg border border-[#E5E7EB] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0072CE]/30 hover:shadow-md"
          >
            <p className="font-mono text-sm font-bold text-[#0072CE]">{item.part_number}</p>
            <p className="mt-1 text-sm font-semibold text-[#1A1A1A] line-clamp-2">{item.name || item.part_number}</p>
            <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">{item.brand || 'Industrial'} {item.category ? `• ${item.category}` : ''}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function RecommendationSections({
  currentPartNumber,
  brandName,
  categoryName,
  keywordSeed,
}: RecommendationSectionsProps) {
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<ProductHit[]>([])
  const [youMayNeed, setYouMayNeed] = useState<ProductHit[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      getProducts({ page: 1, size: 24, category: categoryName || undefined }),
      getProducts({ page: 1, size: 24, brand: brandName || undefined }),
    ])
      .then(([categoryRes, brandRes]) => {
        if (!active) return
        const merged = [...(categoryRes.items || []), ...(brandRes.items || [])] as ProductHit[]
        const dedup = new Map<string, ProductHit>()
        for (const p of merged) {
          const pn = (p.part_number || '').trim()
          if (!pn || pn.toUpperCase() === currentPartNumber.toUpperCase()) continue
          if (!dedup.has(pn)) dedup.set(pn, p)
        }
        const all = Array.from(dedup.values())
        const ranked = all
          .map((p) => ({ item: p, score: scoreProduct(p, keywordSeed, brandName, categoryName) }))
          .sort((a, b) => b.score - a.score)
          .map((x) => x.item)
        setRelated(ranked.slice(0, 8))
        setYouMayNeed(ranked.slice(8, 16))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [currentPartNumber, brandName, categoryName, keywordSeed])

  useEffect(() => {
    try {
      const key = 'recently_viewed_products'
      const raw = localStorage.getItem(key)
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      const next = [currentPartNumber, ...arr.filter((p) => p !== currentPartNumber)].slice(0, 20)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // no-op
    }
  }, [currentPartNumber])

  if (loading) {
    return (
      <section className="mt-10 rounded-xl border border-[#E5E7EB] bg-white p-6">
        <div className="skeleton h-6 w-52 mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (!related.length && !youMayNeed.length) return null

  return (
    <div>
      <ProductList title="Related Products" icon={<PackageSearch className="h-5 w-5 text-[#0072CE]" />} products={related} />
      <ProductList title="You may also need" icon={<Sparkles className="h-5 w-5 text-[#FF7A00]" />} products={youMayNeed} />
    </div>
  )
}
