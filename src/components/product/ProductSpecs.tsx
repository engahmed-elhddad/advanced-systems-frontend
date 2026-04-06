'use client'

import { ProductSpecificationsTable } from '@/components/product/ProductSpecificationsTable'

export interface ProductSpecsProps {
  /** Product specifications as key-value object or array of { key, value } */
  specifications: Record<string, unknown> | Array<{ key?: string; name?: string; value?: unknown; val?: unknown }> | null | undefined
  className?: string
}

function toRecord(
  specs: Record<string, unknown> | Array<{ key?: string; name?: string; value?: unknown; val?: unknown }> | null | undefined
): Record<string, unknown> | null {
  if (!specs) return null
  if (typeof specs === 'object' && !Array.isArray(specs)) return specs as Record<string, unknown>
  if (Array.isArray(specs) && specs.length) {
    const out: Record<string, unknown> = {}
    specs.forEach((s) => {
      const k = s.key ?? s.name
      if (k) out[String(k)] = s.value ?? s.val ?? ''
    })
    return out
  }
  return null
}

export function ProductSpecs({ specifications, className = '' }: ProductSpecsProps) {
  const record = toRecord(specifications)
  return (
    <section aria-labelledby="product-specs-heading" className={className}>
      <h2 id="product-specs-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Specifications
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <ProductSpecificationsTable
          specifications={record}
          hideTitle
          embedded
          className="border-0 shadow-none mb-0"
        />
      </div>
    </section>
  )
}
