'use client'

import { motion } from 'framer-motion'

export interface ProductSpecificationsTableProps {
  specifications: Record<string, unknown> | null | undefined
  className?: string
}

/** Format key for display: voltage_rating -> Voltage Rating */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProductSpecificationsTable({
  specifications,
  className = '',
}: ProductSpecificationsTableProps) {
  if (!specifications || typeof specifications !== 'object') {
    return (
      <section className={className}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Product Specifications
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-6 py-8 text-center">
          <p className="text-gray-500 text-sm">
            No specifications available for this product.
          </p>
        </div>
      </section>
    )
  }

  const entries = Object.entries(specifications).filter(
    ([, v]) => v != null && String(v).trim() !== ''
  )
  if (entries.length === 0) {
    return (
      <section className={className}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Product Specifications
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-6 py-8 text-center">
          <p className="text-gray-500 text-sm">
            No specifications available for this product.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={className}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Product Specifications
      </h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Parameter
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value], i) => (
              <motion.tr
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-5 py-3 text-sm font-medium text-gray-700">
                  {formatKey(key)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-900">
                  {String(value)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  )
}
