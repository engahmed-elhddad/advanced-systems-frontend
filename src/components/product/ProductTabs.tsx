'use client'

import { useState } from 'react'
import { FileText, Download, Package, Layers } from 'lucide-react'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps, type ApiProduct } from '@/lib/productMappers'

type TabId = 'description' | 'specifications' | 'datasheet' | 'related'

interface ProductTabsProps {
  description?: string
  specs?: Array<{ key: string; value: string; unit?: string }>
  specifications?: Record<string, unknown>
  datasheetUrl?: string
  datasheets?: Array<{ url: string; name?: string }>
  relatedProducts?: ApiProduct[]
  crossRefs?: { alternatives?: ApiProduct[]; similar_models?: ApiProduct[]; compatible_modules?: ApiProduct[] }
  imageUrl: (url: string) => string
  apiBase: string
  productBasePath?: string
}

export function ProductTabs({
  description,
  specs = [],
  specifications,
  datasheetUrl,
  datasheets = [],
  relatedProducts = [],
  crossRefs = {},
  imageUrl,
  apiBase,
  productBasePath = '/products',
}: ProductTabsProps) {
  const [active, setActive] = useState<TabId>('description')

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'specifications', label: 'Specifications', icon: Package },
    { id: 'datasheet', label: 'Datasheet', icon: Download },
    { id: 'related', label: 'Related Products', icon: Layers },
  ]

  const allRelated = [
    ...relatedProducts,
    ...(crossRefs.similar_models || []),
    ...(crossRefs.alternatives || []).slice(0, 3),
    ...(crossRefs.compatible_modules || []).slice(0, 3),
  ]
  const hasRelated = allRelated.length > 0
  const hasDatasheet = !!datasheetUrl || datasheets?.length > 0
  const hasSpecs = specs?.length > 0 || (specifications && typeof specifications === 'object' && Object.keys(specifications).length > 0)

  const filteredTabs = tabs.filter((t) => {
    if (t.id === 'description') return !!description
    if (t.id === 'specifications') return hasSpecs
    if (t.id === 'datasheet') return hasDatasheet
    if (t.id === 'related') return hasRelated
    return true
  })

  if (filteredTabs.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {filteredTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              active === id
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {active === 'description' && description && (
          <p className="text-gray-600 leading-relaxed">{description}</p>
        )}
        {active === 'specifications' && hasSpecs && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Specification</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">{s.key}</td>
                    <td className="px-4 py-3 text-gray-900">{s.value} {s.unit || ''}</td>
                  </tr>
                ))}
                {specs.length === 0 && specifications && typeof specifications === 'object' &&
                  Object.entries(specifications).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">{key}</td>
                      <td className="px-4 py-3 text-gray-900">{String(value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {active === 'datasheet' && hasDatasheet && (
          <div className="flex flex-wrap gap-3">
            {datasheetUrl && (
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors"
              >
                <Download className="w-5 h-5 text-primary-600" />
                Download Datasheet
              </a>
            )}
            {datasheets.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors"
              >
                <Download className="w-5 h-5 text-primary-600" />
                {d.name || 'Download'}
              </a>
            ))}
          </div>
        )}
        {active === 'related' && hasRelated && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allRelated.slice(0, 8).map((p: ApiProduct) => (
              <ProductCard key={p.part_number} {...productToCardProps(p)} productBasePath={productBasePath} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
