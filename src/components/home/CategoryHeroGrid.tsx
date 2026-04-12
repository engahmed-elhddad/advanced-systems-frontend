'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { categoryToSlug } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/constants'

interface CategoryItem {
  name: string
  slug: string
  product_count?: number
}

function slugFromName(name: string): string {
  const slug = categoryToSlug(name)
  return slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/categories/`)
    if (!res.ok) return []
    const data = await res.json()
    const list = (data?.categories ?? data) ?? []
    if (!Array.isArray(list)) return []
    return list.map((c: string | { name?: string; slug?: string; product_count?: number }) => {
      if (typeof c === 'string') return { name: c, slug: slugFromName(c), product_count: 0 }
      const name = String((c as { name?: string }).name ?? '')
      return {
        name,
        slug: (c as { slug?: string }).slug ?? slugFromName(name),
        product_count: (c as { product_count?: number }).product_count ?? 0,
      }
    })
  } catch {
    return []
  }
}

export function CategoryHeroGrid() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((list) => {
        if (!cancelled) setCategories(list)
      })
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
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Shop by category</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!categories.length) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name)
            const href = `/category/${encodeURIComponent(cat.slug)}`
            const count = cat.product_count ?? 0
            return (
              <Link
                key={cat.slug}
                href={href}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-orange-400/25 hover:bg-white/[0.08] hover:shadow-[0_0_32px_rgba(139,92,246,0.12)]"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-orange-300/90">
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <span className="font-semibold text-white">{cat.name}</span>
                {count > 0 && <span className="mt-2 text-xs text-white/45">{count} products</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
