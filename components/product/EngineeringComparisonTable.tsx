'use client'

import Link from 'next/link'

interface SpecRow {
  key: string
  current?: string
  alternatives: Record<string, string>
}

interface EngineeringComparisonTableProps {
  currentProduct: { part_number: string; manufacturer?: string; specifications?: Record<string, unknown>; specs?: Array<{ key: string; value: string }> }
  alternatives: Array<{
    part_number: string
    manufacturer?: string
    current?: string
    voltage?: string
    poles?: string
    mounting_type?: string
    specifications?: Record<string, unknown>
  }>
  productBasePath?: string
}

function getVal(specs: Record<string, unknown> | undefined, keys: string[]): string {
  if (!specs || typeof specs !== 'object') return '—'
  for (const k of keys) {
    const v = specs[k] || specs[k.toLowerCase()]
    if (v != null && String(v).trim()) return String(v)
  }
  return '—'
}

export function EngineeringComparisonTable({
  currentProduct,
  alternatives,
  productBasePath = '/part-number',
}: EngineeringComparisonTableProps) {
  if (!alternatives?.length) return null

  const baseSpecs = (typeof currentProduct.specifications === 'object' && currentProduct.specifications)
    ? currentProduct.specifications as Record<string, unknown>
    : (currentProduct.specs || []).reduce((a: Record<string, string>, s: { key: string; value: string }) => {
      a[(s.key || '').toLowerCase()] = s.value
      return a
    }, {} as Record<string, string>)

  const rows: SpecRow[] = [
    {
      key: 'Current',
      current: getVal(baseSpecs, ['current', 'rated_current', 'current_rating']),
      alternatives: Object.fromEntries(
        alternatives.map((a) => {
          const s = a.specifications || {}
          const v = a.current || getVal(s, ['current', 'rated_current', 'current_rating'])
          return [a.part_number, v]
        })
      ),
    },
    {
      key: 'Voltage',
      current: getVal(baseSpecs, ['voltage', 'supply_voltage', 'rated_voltage']),
      alternatives: Object.fromEntries(
        alternatives.map((a) => {
          const s = a.specifications || {}
          const v = a.voltage || getVal(s, ['voltage', 'supply_voltage', 'rated_voltage'])
          return [a.part_number, v]
        })
      ),
    },
    {
      key: 'Poles',
      current: getVal(baseSpecs, ['poles', 'number_of_poles']),
      alternatives: Object.fromEntries(
        alternatives.map((a) => {
          const s = a.specifications || {}
          const v = a.poles || getVal(s, ['poles', 'number_of_poles'])
          return [a.part_number, v]
        })
      ),
    },
    {
      key: 'Mounting Type',
      current: getVal(baseSpecs, ['mounting', 'mounting_type']),
      alternatives: Object.fromEntries(
        alternatives.map((a) => {
          const s = a.specifications || {}
          const v = a.mounting_type || getVal(s, ['mounting', 'mounting_type'])
          return [a.part_number, v]
        })
      ),
    },
  ].filter((r) => r.current !== '—' || Object.values(r.alternatives).some((v) => v !== '—'))

  if (rows.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Engineering Comparison</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Compare specifications across alternatives
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Spec</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 font-mono">
                {currentProduct.part_number}
              </th>
              {alternatives.slice(0, 6).map((a) => (
                <th key={a.part_number} className="px-4 py-3 text-left font-semibold text-gray-700">
                  <Link
                    href={`${productBasePath}/${encodeURIComponent(a.part_number)}`}
                    className="font-mono text-primary-600 hover:underline"
                  >
                    {a.part_number}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-600">{row.key}</td>
                <td className="px-4 py-3 text-gray-900">{row.current}</td>
                {alternatives.slice(0, 6).map((a) => (
                  <td key={a.part_number} className="px-4 py-3 text-gray-900">
                    {row.alternatives[a.part_number] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
