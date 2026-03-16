'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '@/app/lib/constants'

interface TrendingPart {
  part_number: string
  brand?: string
  category?: string
  count?: number
}

async function fetchTrending(): Promise<TrendingPart[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/search/trending?limit=12`)
    if (!res.ok) return []
    const data = await res.json()
    const list = data?.parts ?? []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function TrendingParts() {
  const [parts, setParts] = useState<TrendingPart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTrending().then((list) => {
      if (!cancelled) setParts(list)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Trending Industrial Parts</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!parts.length) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Trending Industrial Parts</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {parts.map((item) => (
            <Link
              key={item.part_number}
              href={`/part-number/${encodeURIComponent(item.part_number)}`}
              className="rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
            >
              <p className="font-mono text-sm font-semibold text-gray-900 truncate" title={item.part_number}>
                {item.part_number}
              </p>
              {item.brand && (
                <p className="mt-0.5 text-xs text-gray-500 truncate">{item.brand}</p>
              )}
              {item.category && (
                <p className="text-xs text-gray-400 truncate">{item.category}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
