'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { categoryToSlug } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/constants'

interface CategoryItem {
  name: string
  slug: string
  product_count?: number
  count?: number
}

function slugFromName(name: string): string {
  const slug = categoryToSlug(name)
  return slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function normalizeCategories(data: unknown): CategoryItem[] {
  type Row = string | { name?: string; slug?: string; product_count?: number; count?: number }
  const mapOne = (c: Row): CategoryItem => {
    if (typeof c === 'string') return { name: c, slug: slugFromName(c) }
    const name = String((c as { name?: string }).name ?? '')
    const slug = (c as { slug?: string }).slug ?? slugFromName(name)
    const product_count = (c as { product_count?: number }).product_count
    const count = (c as { count?: number }).count
    return { name, slug, product_count, count }
  }
  if (Array.isArray(data)) return (data as Row[]).map(mapOne)
  const list = (data as { categories?: Row[] })?.categories
  if (!Array.isArray(list)) return []
  return list.map(mapOne)
}

export function TopCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    apiFetch(`${API_BASE_URL}/api/v1/categories/`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setCategories(normalizeCategories(data))
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="bg-white">
        <h2 className="section-title mb-6">Top Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !categories.length) {
    return null
  }

  return (
    <section className="bg-white">
      <h2 className="section-title mb-6">Top Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name)
          const href = `/categories/${encodeURIComponent(cat.slug)}`
          return (
            <Link
              key={cat.slug}
              href={href}
              className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-accent-50 transition-colors">
                <Icon className="w-6 h-6 text-slate-600 group-hover:text-accent-600 transition-colors" />
              </div>
              <span className="font-medium text-slate-900 truncate group-hover:text-accent-700 transition-colors">
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
