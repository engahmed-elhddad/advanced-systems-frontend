'use client'

import { memo, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useRFQListStore } from '@/state/rfqListStore'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { SafeImage } from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'
import { usePricingGate } from '@/lib/hooks/usePricingGate'

function KeySpecs({
  quickSpecs,
}: {
  quickSpecs: {
    series?: string
    voltage?: string
    current?: string
    coil_voltage?: string
    mounting_type?: string
  }
}) {
  const items: { label: string; value: string }[] = []
  if (quickSpecs.coil_voltage?.trim()) items.push({ label: 'Coil Voltage', value: quickSpecs.coil_voltage.trim() })
  else if (quickSpecs.voltage?.trim()) items.push({ label: 'Voltage', value: quickSpecs.voltage.trim() })
  if (quickSpecs.current?.trim()) items.push({ label: 'Current', value: quickSpecs.current.trim() })
  if (quickSpecs.mounting_type?.trim()) items.push({ label: 'Mounting', value: quickSpecs.mounting_type.trim() })
  if (!items.length && (quickSpecs.series?.trim() || quickSpecs.voltage?.trim() || quickSpecs.current?.trim())) {
    const fallback = [quickSpecs.series, quickSpecs.voltage, quickSpecs.current].filter(Boolean).join(' · ')
    if (fallback) items.push({ label: '', value: fallback })
  }
  if (!items.length) return null
  return (
    <ul className="mt-2 space-y-0.5" aria-label="Key specifications">
      {items.map(({ label, value }) =>
        label ? (
          <li key={label} className="flex flex-wrap gap-x-1.5 text-xs text-white/50">
            <span className="font-medium text-white/40">{label}:</span>
            <span>{value}</span>
          </li>
        ) : (
          <li key="fallback" className="text-xs text-white/50">
            {value}
          </li>
        )
      )}
    </ul>
  )
}

export interface ProductCardProps {
  /** Canonical product id from API (optional; not required for card UI today). */
  id?: number
  /** URL segment for `/products/{slug}`; falls back to part_number when omitted. */
  slug?: string
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  stock_quantity?: number
  availability?: 'in_stock' | 'on_request'
  price_usd?: number | null
  quickSpecs?: {
    series?: string
    voltage?: string
    current?: string
    coil_voltage?: string
    mounting_type?: string
  }
  variant?: 'default' | 'compact'
  productBasePath?: string
}

const shellClass =
  'group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-orange-400/25 hover:shadow-[0_0_32px_rgba(255,122,0,0.1)] focus-within:border-orange-400/35 focus-within:shadow-[0_0_28px_rgba(255,122,0,0.12)]'

function ProductCardInner({
  slug,
  part_number,
  brand,
  manufacturer,
  category,
  description,
  image_url,
  stock_quantity = 0,
  availability = 'on_request',
  price_usd,
  quickSpecs,
  variant = 'default',
  productBasePath = '/products',
}: ProductCardProps) {
  const { format } = useCurrency()
  const { showExactPricing, openLoginModal } = usePricingGate()
  const addItem = useRFQListStore((s) => s.addItem)
  const listItems = useRFQListStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isInList = mounted && listItems.some((i) => i.part_number === part_number)
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'
  const pathSegment = encodeURIComponent((slug || part_number).trim())
  const maker = brand ?? manufacturer ?? 'Brand on request'
  const hasSpecs = Boolean(
    quickSpecs?.coil_voltage?.trim() ||
      quickSpecs?.voltage?.trim() ||
      quickSpecs?.current?.trim() ||
      quickSpecs?.mounting_type?.trim() ||
      quickSpecs?.series?.trim()
  )

  return (
    <div className={cn(shellClass, !compact && 'shadow-lg shadow-black/20')}>
      <Link
        href={`${productBasePath}/${pathSegment}`}
        className={`relative block overflow-hidden border-b border-white/[0.06] bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-inset ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}
      >
        <div className="absolute inset-0">
          <SafeImage
            src={image_url}
            alt={`${maker} ${part_number}`}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute right-2 top-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              In stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
              On request
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'flex flex-1 flex-col p-3' : 'flex flex-1 flex-col p-4'}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{maker}</p>
        <Link
          href={`${productBasePath}/${pathSegment}`}
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]"
        >
          <h3 className="mt-0.5 break-all font-mono text-base font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-orange-200">
            {part_number}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-white/50">{category ?? 'Industrial component'}</p>
        {quickSpecs && <KeySpecs quickSpecs={quickSpecs} />}
        {!hasSpecs && <p className="mt-2 text-xs text-white/40">Specifications available on request</p>}
        {!compact && description && (
          <p className="mb-3 mt-1 flex-1 line-clamp-2 text-xs leading-relaxed text-white/45">{description}</p>
        )}

        {price_usd != null && price_usd > 0 && (
          <div className="mt-2 space-y-2">
            {showExactPricing ? (
              <p className="text-base font-bold tracking-tight text-orange-200">{format(price_usd)}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-white/90">
                  Starting from <span className="text-white">{format(price_usd)}</span>
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openLoginModal()
                  }}
                  className="text-left text-xs font-semibold text-orange-300/90 underline decoration-orange-400/40 underline-offset-2 hover:text-orange-200"
                >
                  Login to view pricing
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-3">
          <Link
            href={`${productBasePath}/${pathSegment}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]"
          >
            View product
          </Link>
          <button
            type="button"
            onClick={() => addItem({ part_number, quantity: 1 })}
            disabled={isInList}
            className={
              isInList
                ? 'inline-flex cursor-default items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-2 text-emerald-200'
                : 'inline-flex items-center justify-center rounded-xl border border-white/15 p-2 text-white/60 transition-all duration-300 hover:border-orange-400/35 hover:text-orange-200'
            }
            aria-label={isInList ? `${part_number} added to RFQ list` : `Add ${part_number} to RFQ list`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ProductCard = memo(ProductCardInner)
