'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Sparkles, PackageSearch, Zap } from 'lucide-react'
import { getProducts } from '@/features/products/services'
import { useUIStore } from '@/state/uiStore'
import { trackRfqCtaClick } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type ProductHit = {
  part_number: string
  slug?: string
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

function HorizontalRow({
  title,
  icon,
  products,
}: {
  title: string
  icon: React.ReactNode
  products: ProductHit[]
}) {
  const openRFQModal = useUIStore((s) => s.openRFQModal)

  if (!products.length) return null
  return (
    <section className="mt-14">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        {icon}
        {title}
      </h2>
      <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-1">
        {products.map((item) => (
          <div
            key={item.part_number}
            className={cn(
              'flex w-[min(280px,85vw)] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300',
              'hover:scale-[1.02] hover:border-white/[0.14] hover:shadow-xl hover:shadow-orange-500/15'
            )}
          >
            <Link
              href={`/products/${encodeURIComponent((item.slug || item.part_number).trim())}`}
              className="group flex flex-1 flex-col"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center border-b border-white/10 bg-black/20 p-4">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.part_number}
                    width={200}
                    height={160}
                    unoptimized
                    loading="lazy"
                    sizes="(max-width: 768px) 85vw, 280px"
                    className="max-h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <PackageSearch className="h-10 w-10 text-white/20" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="font-mono text-sm font-bold text-orange-300">{item.part_number}</p>
                <p className="line-clamp-2 text-sm font-semibold text-white">{item.name || item.part_number}</p>
                <p className="line-clamp-1 text-xs text-white/45">
                  {item.brand || 'Industrial'}
                  {item.category ? ` · ${item.category}` : ''}
                </p>
              </div>
            </Link>
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => {
                  trackRfqCtaClick({
                    source: 'product_recommendations_rfq',
                    part_number: item.part_number,
                  })
                  openRFQModal(item.part_number)
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 py-2.5 text-xs font-bold uppercase tracking-wider text-orange-200 transition-all duration-300 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(255,122,0,0.25)]"
              >
                <Zap className="h-3.5 w-3.5" />
                RFQ
              </button>
            </div>
          </div>
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
        const raw = [...(categoryRes.items || []), ...(brandRes.items || [])] as Record<string, unknown>[]
        const merged: ProductHit[] = raw.map((p) => ({
          part_number: String(p.part_number ?? ''),
          slug: p.slug != null ? String(p.slug) : undefined,
          name: p.name != null ? String(p.name) : undefined,
          brand: String(p.brand ?? p.brand_name ?? ''),
          category: String(p.category ?? p.category_name ?? ''),
          description: p.description != null ? String(p.description) : undefined,
          image_url: String(p.image_url ?? p.primary_image ?? ''),
        }))
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
        setRelated(ranked.slice(0, 12))
        setYouMayNeed(ranked.slice(12, 24))
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
      <section className="mt-14">
        <div className="mb-5 h-7 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 w-[min(280px,85vw)] shrink-0 rounded-xl bg-white/10" />
          ))}
        </div>
      </section>
    )
  }

  if (!related.length && !youMayNeed.length) return null

  return (
    <div>
      <HorizontalRow
        title="Related products"
        icon={<PackageSearch className="h-5 w-5 text-orange-300" />}
        products={related}
      />
      <HorizontalRow
        title="You may also need"
        icon={<Sparkles className="h-5 w-5 text-violet-300" />}
        products={youMayNeed}
      />
    </div>
  )
}
