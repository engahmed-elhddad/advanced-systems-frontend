'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PackageSearch, Search, ArrowRight } from 'lucide-react'
import { getProducts } from '@/features/products/services/catalog'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'

type Hit = { part_number: string; slug?: string; name?: string; image_url?: string }

function slugFromPath(pathname: string | null): string {
  if (!pathname?.startsWith('/products/')) return ''
  const seg = pathname.slice('/products/'.length).split('?')[0]
  try {
    return decodeURIComponent(seg || '')
  } catch {
    return seg || ''
  }
}

export function ProductSlugNotFoundClient() {
  const pathname = usePathname()
  const decoded = slugFromPath(pathname)
  const [items, setItems] = useState<Hit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!decoded.trim()) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const q = decoded.trim()
    getProducts({ search: q, page: 1, size: 12 })
      .then((res) => {
        if (cancelled) return
        const raw = res.items ?? []
        const out: Hit[] = []
        const seen = new Set<string>()
        for (const p of raw) {
          const row = p as unknown as Record<string, unknown>
          const pn = String(row.part_number ?? '').trim()
          if (!pn || pn.toUpperCase() === q.toUpperCase()) continue
          if (seen.has(pn.toUpperCase())) continue
          seen.add(pn.toUpperCase())
          out.push({
            part_number: pn,
            slug: row.slug != null ? String(row.slug) : undefined,
            name: row.name != null ? String(row.name) : undefined,
            image_url: String(row.image_url ?? row.primary_image ?? '').trim() || undefined,
          })
          if (out.length >= 6) break
        }
        setItems(out)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [decoded])

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200">
          <PackageSearch className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Similar products you can request</h2>
          <p className="mt-1 text-sm text-white/55">
            We couldn&apos;t load this exact URL — browse these close matches or search the catalog.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const href = `/products/${encodeURIComponent((p.slug || p.part_number).trim())}`
            return (
              <li key={p.part_number}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3 transition-all',
                    'hover:border-orange-400/35 hover:bg-orange-500/10',
                  )}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <SafeImage
                      src={p.image_url}
                      alt=""
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-white">{p.part_number}</p>
                    {p.name ? <p className="truncate text-xs text-white/45">{p.name}</p> : null}
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-300">
                      View &amp; RFQ <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-white/50">
          No automatic matches for &quot;{decoded}&quot;. Try a shorter part number or keyword in search.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:brightness-110"
        >
          <Search className="h-4 w-4" />
          Search catalog
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-orange-400/35"
        >
          Browse all products
        </Link>
        <Link
          href={decoded ? `/rfq?part_number=${encodeURIComponent(decoded)}` : '/rfq'}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/10 px-5 py-3 text-sm font-semibold text-orange-100 transition-colors hover:bg-orange-500/20"
        >
          RFQ this part number
        </Link>
      </div>
    </section>
  )
}
