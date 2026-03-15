'use client'

import { useState } from 'react'
import { FileText, Package } from 'lucide-react'

export interface ProductDescriptionSpecsTabsProps {
  description?: string | null
  specifications?: Record<string, unknown> | null
  /** Optional array of { key, value } for specs */
  specs?: Array<{ key: string; value: string; unit?: string }> | null
  className?: string
}

export function ProductDescriptionSpecsTabs({
  description,
  specifications,
  specs = [],
  className = '',
}: ProductDescriptionSpecsTabsProps) {
  const [active, setActive] = useState<'description' | 'specifications'>('description')
  const hasSpecs = (specs && specs.length > 0) || (specifications && typeof specifications === 'object' && Object.keys(specifications).length > 0)
  const hasDescription = !!description && description.trim().length > 0

  if (!hasDescription && !hasSpecs) return null

  const specEntries = specs?.length
    ? specs
    : specifications && typeof specifications === 'object'
      ? Object.entries(specifications).map(([key, value]) => ({ key, value: String(value ?? ''), unit: '' }))
      : []

  return (
    <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      <div className="flex border-b border-gray-200">
        {hasDescription && (
          <button
            type="button"
            onClick={() => setActive('description')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              active === 'description'
                ? 'text-accent-600 border-b-2 border-accent-500 bg-accent-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Description
          </button>
        )}
        {hasSpecs && (
          <button
            type="button"
            onClick={() => setActive('specifications')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              active === 'specifications'
                ? 'text-accent-600 border-b-2 border-accent-500 bg-accent-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            Specifications
          </button>
        )}
      </div>
      <div className="p-6">
        {active === 'description' && hasDescription && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            {description}
          </div>
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
                {specEntries.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">{row.key}</td>
                    <td className="px-4 py-3 text-gray-900">{row.value} {row.unit ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
