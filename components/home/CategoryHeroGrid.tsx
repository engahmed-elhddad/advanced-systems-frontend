'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { categoryToSlug } from '@/app/lib/constants'
import { API_BASE_URL } from '@/app/lib/constants'

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
    const res = await fetch(`${API_BASE_URL}/categories`)
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
    fetchCategories().then((list) => {
      if (!cancelled) setCategories(list)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!categories.length) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name)
            const href = `/category/${encodeURIComponent(cat.slug)}`
            const count = cat.product_count ?? 0
            return (
              <Link
                key={cat.slug}
                href={href}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <span className="font-semibold text-gray-900">{cat.name}</span>
                {count > 0 && (
                  <span className="mt-1 text-xs text-gray-500">{count} products</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
