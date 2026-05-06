'use client'

import { memo, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { trackClickProduct } from '@/lib/analytics'
import { SafeImage } from '@/components/ui/SafeImage'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { HighlightMatch } from '@/components/search/SearchHighlight'
import { cn } from '@/lib/utils'
import { usePricingGate } from '@/lib/hooks/usePricingGate'
import { formatEgp, formatUsd, pricingVatLabel } from '@/lib/pricing'
import { useCart } from '@/context/CartContext'
import type { ProductPricing } from '@/types/product'
import type { StockBadge } from '@/types/warehouse'
import { StockBadgeList } from '@/components/products/StockBadgeList'

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
          <li key={label} className="flex flex-wrap gap-x-1.5 text-xs text-[--text-secondary]">
            <span className="font-medium text-[--text-secondary]">{label}:</span>
            <span>{value}</span>
          </li>
        ) : (
          <li key="fallback" className="text-xs text-[--text-secondary]">
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
  pricing?: ProductPricing | null
  quickSpecs?: {
    series?: string
    voltage?: string
    current?: string
    coil_voltage?: string
    mounting_type?: string
  }
  brand_slug?: string
  brand_logo_url?: string
  /** Display name for brand link under title; when absent, legacy maker row is used. */
  brand_name?: string
  variant?: 'default' | 'compact'
  productBasePath?: string
  /** When set (e.g. catalog search), matching tokens are emphasized in title lines. */
  highlightQuery?: string
  lifecycle_status?: string
  stock_badges?: StockBadge[]
}

const shellClass =
  'group flex flex-col overflow-hidden rounded-xl border border-[--border] bg-[--bg-elevated] transition-all duration-300 hover:scale-[1.02] hover:border-[--accent]/30 focus-within:border-[--accent]/40'

function ProductCardInner({
  id,
  slug,
  part_number,
  brand,
  manufacturer,
  brand_slug,
  brand_logo_url,
  brand_name,
  category,
  description,
  image_url,
  stock_quantity = 0,
  availability = 'on_request',
  price_usd,
  pricing,
  quickSpecs,
  variant = 'default',
  productBasePath = '/products',
  highlightQuery,
  lifecycle_status,
  stock_badges,
}: ProductCardProps) {
  const { showExactPricing, openLoginModal } = usePricingGate()
  const { addItem, items: cartItems } = useCart()
  const isInListFromStore = cartItems.some((i) => i.part_number === part_number)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  const isInList = hydrated && isInListFromStore
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'
  const pathSegment = encodeURIComponent((slug || part_number).trim())
  const productHref = `${productBasePath}/${pathSegment}`
  const logProductClick = (surface: string) =>
    trackClickProduct({
      source: 'product_card',
      list_context: surface,
      part_number,
      slug: slug || undefined,
      product_id: id,
      href: productHref,
    })
  const maker = brand ?? manufacturer ?? 'Brand on request'
  const brandNameTrim = brand_name?.trim()
  const brandSlugTrim = brand_slug?.trim()
  const showLegacyBrandRow = !brandNameTrim
  const showBrandLink = Boolean(brandNameTrim && brandSlugTrim)
  const brandHref = brandSlugTrim ? `/brands/${encodeURIComponent(brandSlugTrim)}/` : null
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
        href={productHref}
        onClick={() => logProductClick('card_image')}
        className={`relative block overflow-hidden border-b border-[--border] bg-[--bg-surface] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/50 focus-visible:ring-inset ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}
      >
        {brand_logo_url?.trim() ? (
          <div
            className="pointer-events-none absolute left-2 top-2 z-10 h-6 w-6 overflow-hidden rounded-md border border-[--border] bg-[--bg-elevated]/90 p-0.5 shadow-sm"
            aria-hidden
          >
            <SafeImage
              src={brand_logo_url.trim()}
              alt={brandNameTrim || maker}
              sizes="24px"
              className="object-contain"
            />
          </div>
        ) : null}
        <div className="absolute inset-0">
          <SafeImage
            src={image_url}
            alt={`${maker} ${part_number}`}
            sizes={
              compact
                ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
            }
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {inStock ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              In stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
              On request
            </span>
          )}
          {lifecycle_status === 'nrnd' && (
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
              NRND
            </span>
          )}
          {lifecycle_status === 'obsolete' && (
            <span className="inline-flex items-center rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-100">
              Obsolete
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'flex flex-1 flex-col p-3' : 'flex flex-1 flex-col p-4'}>
        {showLegacyBrandRow ? (
          <div className="mb-1 flex items-center gap-2">
            <BrandLogo brand={maker} variant="default" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-secondary]">
              {highlightQuery?.trim() ? <HighlightMatch text={maker} query={highlightQuery} /> : maker}
            </p>
          </div>
        ) : null}
        <Link
          href={productHref}
          onClick={() => logProductClick('card_title')}
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[--bg-elevated]"
        >
          <h3 className="mt-0.5 break-all font-mono text-base font-semibold leading-snug text-[--text-primary] transition-colors duration-300 group-hover:text-[--accent]">
            {highlightQuery?.trim() ? (
              <HighlightMatch text={part_number} query={highlightQuery} />
            ) : (
              part_number
            )}
          </h3>
        </Link>
        {brandNameTrim ? (
          showBrandLink && brandHref ? (
            <Link
              href={brandHref}
              onClick={() => logProductClick('card_brand')}
              className="mt-0.5 block w-fit text-xs font-medium text-[--accent] underline decoration-[--accent]/35 underline-offset-2 hover:text-[--accent-hover]"
            >
              {highlightQuery?.trim() ? (
                <HighlightMatch text={brandNameTrim} query={highlightQuery} />
              ) : (
                brandNameTrim
              )}
            </Link>
          ) : (
            <p className="mt-0.5 text-xs font-medium text-[--text-secondary]">
              {highlightQuery?.trim() ? (
                <HighlightMatch text={brandNameTrim} query={highlightQuery} />
              ) : (
                brandNameTrim
              )}
            </p>
          )
        ) : null}
        <p className="mt-0.5 text-xs text-[--text-secondary]">
          {highlightQuery?.trim() && category ? (
            <HighlightMatch text={category} query={highlightQuery} />
          ) : (
            category ?? 'Industrial component'
          )}
        </p>
        <StockBadgeList badges={stock_badges ?? [{ kind: 'indent' }]} compact className="mt-1" />
        {quickSpecs && <KeySpecs quickSpecs={quickSpecs} />}
        {!hasSpecs && <p className="mt-2 text-xs text-[--text-secondary]">Specifications available on request</p>}
        {!compact && description && (
          <p className="mb-3 mt-1 flex-1 line-clamp-2 text-xs leading-relaxed text-[--text-secondary]">
            {highlightQuery?.trim() ? <HighlightMatch text={description} query={highlightQuery} /> : description}
          </p>
        )}

        {(pricing?.unit_price_usd != null || (price_usd != null && price_usd > 0)) && (
          <div className="mt-2 space-y-2">
            {(() => {
              const usdText = formatUsd(pricing?.unit_price_usd ?? price_usd)
              const egpText = formatEgp(pricing?.unit_price_egp)
              if (!usdText) return null
              return showExactPricing ? (
                <>
                  <p className="text-base font-bold tracking-tight text-[--accent]">{usdText}</p>
                  {egpText ? <p className="text-xs font-semibold text-[--text-secondary]">{egpText}</p> : null}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[--text-secondary]">
                    {pricingVatLabel(pricing ?? undefined)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[--text-secondary]">
                    Starting from <span className="text-[--text-primary]">{usdText}</span>
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openLoginModal()
                    }}
                    className="text-left text-xs font-semibold text-[--accent] underline decoration-[--accent]/40 underline-offset-2 hover:text-[--accent-hover]"
                  >
                    Login to view pricing
                  </button>
                </>
              )
            })()}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-[--border] pt-3">
          <Link
            href={productHref}
            onClick={() => logProductClick('card_cta_view')}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[--accent] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[--bg-elevated]"
          >
            View product
          </Link>
          <button
            type="button"
            onClick={() => {
              void addItem({ part_number, qty: 1 })
            }}
            disabled={isInList}
            className={
              isInList
                ? 'inline-flex cursor-default items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-2 text-emerald-200'
                : 'inline-flex items-center justify-center rounded-xl border border-[--border] p-2 text-[--text-secondary] transition-all duration-300 hover:border-[--accent]/35 hover:text-[--accent]'
            }
            aria-label={isInList ? `${part_number} added to cart` : `Add ${part_number} to cart`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ProductCard = memo(ProductCardInner)
