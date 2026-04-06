'use client'

import Link from 'next/link'
import { Eye } from 'lucide-react'
import { SafeImage } from '@/components/common/SafeImage'

interface AlternativeItem {
  part_number: string
  manufacturer?: string
  category?: string
  description?: string
  image_url?: string
  match_type?: string
  confidence_score?: number
  current?: string
  voltage?: string
  poles?: string
  mounting_type?: string
  specifications?: Record<string, unknown>
}

interface AlternativeProductsProps {
  alternatives: AlternativeItem[]
  currentProduct: { part_number: string; specifications?: Record<string, unknown>; specs?: Array<{ key: string; value: string }> }
  productBasePath?: string
  imageUrl?: (url: string) => string
}

function specVal(specs: Record<string, unknown> | undefined, keys: string[]): string {
  if (!specs || typeof specs !== 'object') return ''
  for (const k of keys) {
    const v = specs[k] || specs[k.toLowerCase()]
    if (v != null && String(v).trim()) return String(v)
  }
  return ''
}

export function AlternativeProducts({
  alternatives,
  currentProduct,
  productBasePath = '/part-number',
  imageUrl,
}: AlternativeProductsProps) {
  if (!alternatives?.length) return null

  const baseSpecs = currentProduct.specifications
    || (currentProduct.specs?.reduce((a: Record<string, string>, s: { key: string; value: string }) => {
      a[s.key?.toLowerCase?.() || s.key] = s.value
      return a
    }, {} as Record<string, string>) || {})

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Alternative Products</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Equivalent or compatible parts from multiple brands
        </p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {alternatives.slice(0, 8).map((alt) => {
            const specs = alt.specifications || {}
            const curr = alt.current || specVal(specs, ['current', 'rated_current', 'current_rating'])
            const volt = alt.voltage || specVal(specs, ['voltage', 'supply_voltage', 'rated_voltage'])
            const poles = alt.poles || specVal(specs, ['poles', 'number_of_poles'])
            const mfg = alt.manufacturer || ''
            const imgSrc = alt.image_url || ''
            return (
              <Link
                key={alt.part_number}
                href={`${productBasePath}/${encodeURIComponent(alt.part_number)}`}
                className="group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                  <SafeImage
                    src={imgSrc}
                    alt={alt.part_number}
                    className="object-contain max-h-full w-auto group-hover:scale-105 transition-transform"
                  />
                  {alt.match_type && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                      {alt.match_type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  {mfg && (
                    <div className="mb-1 text-xs text-gray-600">{mfg}</div>
                  )}
                  <span className="font-mono font-semibold text-gray-900 text-sm block truncate">
                    {alt.part_number}
                  </span>
                  {(curr || volt || poles) && (
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      {curr && <div>Current: {curr}</div>}
                      {volt && <div>Voltage: {volt}</div>}
                      {poles && <div>Poles: {poles}</div>}
                    </div>
                  )}
                  <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 group-hover:text-primary-700">
                    <Eye className="w-4 h-4" />
                    View Product
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
