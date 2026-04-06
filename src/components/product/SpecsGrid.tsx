'use client'

import { motion } from 'framer-motion'
import { Activity, Cpu, Gauge, Layers, Shield, Zap } from 'lucide-react'

export interface SpecsGridProps {
  specs?: Record<string, unknown> | null
  fallbackSeries?: string
}

function getSpec(specs: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!specs || typeof specs !== 'object') return '—'
  for (const key of keys) {
    const value = specs[key] ?? specs[key.toLowerCase()]
    if (value != null && String(value).trim()) return String(value)
  }
  return '—'
}

const ITEMS = [
  { label: 'Voltage', icon: Zap, keys: ['voltage', 'supply_voltage', 'rated_voltage'] },
  { label: 'Current', icon: Gauge, keys: ['current', 'rated_current', 'current_rating'] },
  { label: 'Mounting Type', icon: Layers, keys: ['mounting_type', 'mounting', 'mount_type'] },
  { label: 'Protection', icon: Shield, keys: ['protection_rating', 'ip_rating', 'protection'] },
  { label: 'Output', icon: Activity, keys: ['output_type', 'output', 'type'] },
  { label: 'Series', icon: Cpu, keys: ['series'] },
]

export function SpecsGrid({ specs, fallbackSeries }: SpecsGridProps) {
  const hasAnySpec = Boolean(
    getSpec(specs, 'voltage', 'supply_voltage', 'rated_voltage') !== '—' ||
      getSpec(specs, 'current', 'rated_current', 'current_rating') !== '—' ||
      getSpec(specs, 'mounting_type', 'mounting', 'mount_type') !== '—' ||
      getSpec(specs, 'protection_rating', 'ip_rating', 'protection') !== '—' ||
      getSpec(specs, 'output_type', 'output', 'type') !== '—' ||
      Boolean(fallbackSeries) ||
      getSpec(specs, 'series') !== '—'
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg shadow-slate-200/60">
      <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Specifications</h2>
      <p className="mt-1 text-sm text-slate-500">Structured technical highlights for fast evaluation.</p>
      {!hasAnySpec && (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Full technical details available upon request
        </p>
      )}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ITEMS.map((item, idx) => {
          const value =
            item.label === 'Series'
              ? fallbackSeries || getSpec(specs, ...item.keys)
              : getSpec(specs, ...item.keys)
          const Icon = item.icon
          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0B1F3A] shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              </div>
              <p className="mt-3 text-base font-semibold text-slate-900 break-words">{value}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
