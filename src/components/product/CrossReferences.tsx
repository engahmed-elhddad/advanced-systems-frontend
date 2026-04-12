'use client'

import Link from 'next/link'
import { AlternativeProducts } from '@/components/product/AlternativeProducts'

export interface CrossRefItem {
  part_number: string
  manufacturer?: string
  category?: string
  [key: string]: unknown
}

export interface CrossReferencesData {
  alternatives?: CrossRefItem[]
  similar_models?: CrossRefItem[]
  compatible_modules?: CrossRefItem[]
}

export interface CrossReferencesProps {
  crossRefs: CrossReferencesData
  currentProduct: { part_number: string; specifications?: Record<string, unknown>; specs?: Array<{ key: string; value: string }> }
  productBasePath?: string
  /** Resolves image URL string to full URL (used by AlternativeProducts) */
  imageUrl: (url: string) => string
  className?: string
}

export function CrossReferences({
  crossRefs,
  currentProduct,
  productBasePath = '/products',
  imageUrl,
  className = '',
}: CrossReferencesProps) {
  const alternatives = crossRefs.alternatives ?? []
  const similarModels = crossRefs.similar_models ?? []
  const compatibleModules = crossRefs.compatible_modules ?? []
  const hasCrossRefs = alternatives.length > 0 || similarModels.length > 0 || compatibleModules.length > 0

  if (!hasCrossRefs) return null

  return (
    <section aria-labelledby="cross-refs-heading" className={className}>
      <h2 id="cross-refs-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Cross References
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {alternatives.length > 0 && (
          <div className="lg:col-span-2">
            <AlternativeProducts
              alternatives={alternatives}
              currentProduct={currentProduct}
              productBasePath={productBasePath}
              imageUrl={imageUrl}
            />
          </div>
        )}
        {(similarModels.length > 0 || compatibleModules.length > 0) && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Similar &amp; Compatible
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {similarModels.slice(0, 6).map((p) => (
                <Link
                  key={p.part_number}
                  href={`${productBasePath}/${encodeURIComponent(p.part_number)}`}
                  className="block px-3 py-2 rounded-lg border border-gray-100 hover:border-accent-200 hover:bg-accent-50/50 font-mono text-sm transition-colors"
                >
                  {p.part_number}
                  {p.manufacturer && (
                    <span className="text-gray-500 font-sans ml-2">({p.manufacturer})</span>
                  )}
                </Link>
              ))}
              {compatibleModules.slice(0, 6).map((p) => (
                <Link
                  key={p.part_number}
                  href={`${productBasePath}/${encodeURIComponent(p.part_number)}`}
                  className="block px-3 py-2 rounded-lg border border-gray-100 hover:border-accent-200 hover:bg-accent-50/50 font-mono text-sm transition-colors"
                >
                  {p.part_number}
                  {p.manufacturer && (
                    <span className="text-gray-500 font-sans ml-2">({p.manufacturer})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
