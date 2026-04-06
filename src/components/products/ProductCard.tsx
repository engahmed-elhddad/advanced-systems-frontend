'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useRFQListStore } from '@/state/rfqListStore'
import { useCurrency } from '@/hooks/useCurrency'
import { SafeImage } from '@/components/common/SafeImage'


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
          <li key={label} className="text-xs text-[#6B7280] flex flex-wrap gap-x-1.5">
            <span className="text-[#9CA3AF] font-medium">{label}:</span>
            <span>{value}</span>
          </li>
        ) : (
          <li key="fallback" className="text-xs text-[#6B7280]">{value}</li>
        )
      )}
    </ul>
  )
}

export interface ProductCardProps {
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

function ProductCardInner({
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
  const addItem = useRFQListStore((s) => s.addItem)
  const listItems = useRFQListStore((s) => s.items)
  const isInList = listItems.some((i) => i.part_number === part_number)
  const inStock = availability === 'in_stock' || stock_quantity > 0
  const compact = variant === 'compact'
  const maker = brand ?? manufacturer ?? 'Brand on request'
  const hasSpecs = Boolean(
    quickSpecs?.coil_voltage?.trim() ||
      quickSpecs?.voltage?.trim() ||
      quickSpecs?.current?.trim() ||
      quickSpecs?.mounting_type?.trim() ||
      quickSpecs?.series?.trim()
  )

  return (
    <div
      className={
        compact
          ? 'group flex flex-col rounded-[2px] border border-[#E5E7EB] bg-white overflow-hidden hover:border-[#0072CE]/40 hover:shadow-sm hover:-translate-y-px focus-within:border-[#0072CE] focus-within:ring-1 focus-within:ring-[#0072CE]/20 transition-all duration-150'
          : 'group flex flex-col rounded-[2px] border border-[#E5E7EB] bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#0072CE]/40 hover:-translate-y-px focus-within:border-[#0072CE] focus-within:ring-1 focus-within:ring-[#0072CE]/20 transition-all duration-150'
      }
    >
      <Link
        href={`${productBasePath}/${encodeURIComponent(part_number)}`}
        className={`block relative bg-[#F9FAFB] overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/3]'} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] focus-visible:ring-inset`}
      >
        <div className="absolute inset-0">
          <SafeImage
            src={image_url}
            alt={`${maker} ${part_number}`}
            className="h-full w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>
        <div className="absolute top-2 right-2">
          {inStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-[#E8F4FD] text-[#0072CE] border border-[#0072CE]/20">
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30">
              On Request
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'p-3 flex flex-col flex-1' : 'p-4 flex flex-col flex-1'}>
        <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
          {maker}
        </p>
        <Link
          href={`${productBasePath}/${encodeURIComponent(part_number)}`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] focus-visible:ring-offset-1 rounded-[2px]"
        >
          <h3 className="font-mono font-semibold text-base text-[#1A1A1A] group-hover:text-[#0072CE] transition-colors duration-150 leading-snug mt-0.5 break-all">
            {part_number}
          </h3>
        </Link>
        <p className="text-xs text-[#6B7280] mt-0.5">{category ?? 'Industrial Component'}</p>
        {quickSpecs && <KeySpecs quickSpecs={quickSpecs} />}
        {!hasSpecs && (
          <p className="mt-2 text-xs text-[#6B7280]">Specifications available on request</p>
        )}
        {!compact && description && (
          <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed mb-3 flex-1 mt-1">
            {description}
          </p>
        )}

        {price_usd != null && price_usd > 0 && (
          <p className="text-sm font-semibold text-[#1A1A1A] mt-2">{format(price_usd)}</p>
        )}

        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[#E5E7EB]">
          <Link
            href={`${productBasePath}/${encodeURIComponent(part_number)}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-[2px] text-sm font-semibold bg-[#0072CE] hover:bg-[#005BA4] text-white transition-colors duration-150 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0072CE] focus-visible:ring-offset-2"
          >
            View Product
          </Link>
          <button
            type="button"
            onClick={() => addItem({ part_number, quantity: 1 })}
            disabled={isInList}
            className={`inline-flex items-center justify-center p-2 rounded-[2px] border transition-colors duration-150 ${
              isInList
                ? 'border-[#10B981]/30 bg-[#D1FAE5] text-[#065F46] cursor-default'
                : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#0072CE]/40 hover:text-[#0072CE]'
            }`}
            aria-label={isInList ? `${part_number} added to RFQ list` : `Add ${part_number} to RFQ list`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const ProductCard = memo(ProductCardInner)
