'use client'

import Link from 'next/link'
import {
  Cpu, Gauge, Radio, Monitor, Zap, Shield, ToggleRight, Package,
} from 'lucide-react'
import { useCategories } from '@/features/products/hooks/useCategories'
import type { LucideIcon } from 'lucide-react'

function iconForCategory(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('plc')) return Cpu
  if (n.includes('drive')) return Gauge
  if (n.includes('sensor')) return Radio
  if (n.includes('hmi')) return Monitor
  if (n.includes('power')) return Zap
  if (n.includes('safety')) return Shield
  if (n.includes('soft') || n.includes('starter')) return ToggleRight
  return Package
}

export function HeroSection() {
  const { data: categories = [] } = useCategories()

  return (
    <section
      className="relative flex min-h-[82vh] w-full flex-col justify-center pb-8"
      style={{ backgroundColor: 'var(--bg-header)' }}
    >
      <div className="w-full py-16 sm:py-24 lg:py-28 page-container">
        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
            Industrial automation marketplace
          </p>

          <h1 className="mb-7 text-5xl font-bold leading-tight text-white">
            Parts that power{' '}
            <span className="text-[--accent]">your line</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/60">
            Search millions of components by part number, brand, or category — engineered for
            procurement teams who need speed and certainty.
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="bg-[--accent] hover:bg-[--accent-hover] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse products
            </Link>
            <Link
              href="/rfq/instant"
              className="border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/5"
            >
              Request quote
            </Link>
          </div>

          {/* Category grid — real categories from API */}
          {categories.length > 0 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {categories.slice(0, 8).map((cat) => {
                const Icon = iconForCategory(cat.name)
                const href = cat.slug ? `/categories/${cat.slug}` : '/categories'
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 transition-colors hover:border-[--accent] hover:bg-white/10"
                  >
                    <Icon className="h-6 w-6 text-[--accent]" />
                    <span className="text-xs font-medium text-white/60 text-center leading-tight">{cat.name}</span>
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
