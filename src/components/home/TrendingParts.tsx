'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/constants'

interface TrendingPart {
  part_number: string
  brand?: string
  category?: string
  count?: number
}

async function fetchTrending(): Promise<TrendingPart[]> {
  const parse = async (res: Response) => {
    const data = await res.json()
    const list = data?.parts ?? []
    return Array.isArray(list) ? list : []
  }
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/search/trending?limit=12`)
    if (res.ok) return await parse(res)
  } catch {
    /* */
  }
  try {
    const res = await apiFetch(`${API_BASE_URL}/search/trending?limit=12`)
    if (!res.ok) return []
    return await parse(res)
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
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Trending part numbers</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!parts.length) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">Trending part numbers</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {parts.map((item) => (
            <Link
              key={item.part_number}
              href={`/products/${encodeURIComponent(item.part_number)}`}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:border-violet-400/25 hover:bg-white/[0.08]"
            >
              <p className="truncate font-mono text-sm font-semibold text-white" title={item.part_number}>
                {item.part_number}
              </p>
              {item.brand && <p className="mt-1 truncate text-xs text-white/50">{item.brand}</p>}
              {item.category && <p className="truncate text-xs text-white/35">{item.category}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
