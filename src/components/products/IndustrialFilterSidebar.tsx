'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CDN_BASE_URL } from '@/lib/constants'
import { resolvePublicMediaUrl } from '@/lib/resolveImage'
import type { Brand, Category } from '@/types/product'

export function brandLogoSrc(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/uploads/')) return resolvePublicMediaUrl(u)
  if (u.startsWith('/')) return `${CDN_BASE_URL.replace(/\/$/, '')}${u}`
  return u
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/[0.08] pb-3 mb-3 last:mb-0 last:border-0 last:pb-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-200 transition-all duration-300"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  )
}

export interface IndustrialFilterSidebarProps {
  brands: Brand[]
  categories: Category[]
  facets: { series: string[]; specs: Record<string, string[]> }
  categoryIds: number[]
  brandIds: number[]
  seriesVals: string[]
  availabilityVals: string[]
  specTokens: string[]
  onToggleCategory: (id: number) => void
  onToggleBrand: (id: number) => void
  onToggleSeries: (s: string) => void
  onToggleAvailability: (a: string) => void
  onToggleSpec: (token: string) => void
  className?: string
}

export function IndustrialFilterSidebar({
  brands,
  categories,
  facets,
  categoryIds,
  brandIds,
  seriesVals,
  availabilityVals,
  specTokens,
  onToggleCategory,
  onToggleBrand,
  onToggleSeries,
  onToggleAvailability,
  onToggleSpec,
  className,
}: IndustrialFilterSidebarProps) {
  const shell =
    'rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-all duration-300'

  return (
    <aside
      className={cn(
        shell,
        'w-full shrink-0 lg:w-[min(100%,280px)] lg:sticky lg:top-24 lg:self-start max-h-[calc(100vh-6rem)] overflow-y-auto',
        className
      )}
    >
      <FilterSection title="Category" defaultOpen>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/40"
                checked={categoryIds.includes(c.id)}
                onChange={() => onToggleCategory(c.id)}
              />
              <span className="leading-snug">
                {c.name}
                {c.product_count != null ? (
                  <span className="ml-1 text-xs text-slate-500">({c.product_count})</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand" defaultOpen>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {brands.map((b) => {
            const logo = brandLogoSrc(b.logo_url)
            return (
              <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/40"
                  checked={brandIds.includes(b.id)}
                  onChange={() => onToggleBrand(b.id)}
                />
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded bg-white/90 object-contain p-0.5"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-slate-400">
                    {(b.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="leading-snug">
                  {b.name}
                  {b.product_count != null ? (
                    <span className="ml-1 text-xs text-slate-500">({b.product_count})</span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        {[
          { id: 'in_stock', label: 'In stock' },
          { id: 'on_request', label: 'On request' },
        ].map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500"
              checked={availabilityVals.includes(o.id)}
              onChange={() => onToggleAvailability(o.id)}
            />
            {o.label}
          </label>
        ))}
      </FilterSection>

      {facets.series.length > 0 && (
        <FilterSection title="Series">
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {facets.series.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500"
                  checked={seriesVals.includes(s)}
                  onChange={() => onToggleSeries(s)}
                />
                <span className="truncate">{s}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {Object.entries(facets.specs).map(([specKey, values]) => {
        if (!values?.length) return null
        return (
          <FilterSection key={specKey} title={specKey}>
            <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
              {values.map((val) => {
                const token = `${specKey}:${val}`
                return (
                  <label key={token} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500"
                      checked={specTokens.includes(token)}
                      onChange={() => onToggleSpec(token)}
                    />
                    <span className="truncate">{val}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>
        )
      })}
    </aside>
  )
}
