'use client'

import { motion } from 'framer-motion'
import { Zap, Gauge, LayoutGrid, Layers } from 'lucide-react'

export interface ProductSpecsCardsProduct {
  specifications?: Record<string, unknown> | null
  series?: string
  voltage?: string
  current?: string
  mounting_type?: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
}

function getSpec(
  specs: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  if (!specs || typeof specs !== 'object') return '—'
  for (const k of keys) {
    const v = specs[k] ?? specs[k.toLowerCase()]
    if (v != null && String(v).trim()) return String(v)
  }
  return '—'
}

const cards = [
  {
    key: 'voltage',
    label: 'Voltage',
    icon: Zap,
    keys: ['voltage', 'supply_voltage', 'rated_voltage', 'operating_voltage'],
  },
  {
    key: 'current',
    label: 'Current',
    icon: Gauge,
    keys: ['current', 'rated_current', 'current_rating', 'nominal_current'],
  },
  {
    key: 'mounting_type',
    label: 'Mounting Type',
    icon: LayoutGrid,
    keys: ['mounting_type', 'mounting', 'mount_type'],
  },
  {
    key: 'series',
    label: 'Series',
    icon: Layers,
    keys: ['series'],
  },
]

export interface ProductSpecsCardsProps {
  product: ProductSpecsCardsProduct
}

export function ProductSpecsCards({ product }: ProductSpecsCardsProps) {
  const specs = product.specifications ?? {}
  const seriesFromProduct = product.series ?? ''

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Key specifications</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const value =
            card.key === 'series'
              ? seriesFromProduct || getSpec(specs, ...card.keys)
              : getSpec(specs, ...card.keys)
          const Icon = card.icon
          return (
            <motion.div
              key={card.key}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-lg hover:border-blue-100 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.label}
                </span>
              </div>
              <p className="text-gray-900 font-semibold text-lg truncate" title={value}>
                {value}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
