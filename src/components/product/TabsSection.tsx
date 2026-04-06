'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Package, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { autoLink } from '@/lib/autoLink'

type Tab = 'description' | 'specifications' | 'datasheet' | 'shipping'

export interface TabsSectionProps {
  description?: string
  specs?: Record<string, unknown> | null
  datasheetUrl?: string | null
}

function toEntries(specs?: Record<string, unknown> | null) {
  if (!specs || typeof specs !== 'object') return []
  return Object.entries(specs).filter(([, v]) => v != null && String(v).trim() !== '')
}

export function TabsSection({ description, specs, datasheetUrl }: TabsSectionProps) {
  const [active, setActive] = useState<Tab>('description')
  const specEntries = useMemo(() => toEntries(specs), [specs])
  const linkedDescription = useMemo(
    () =>
      autoLink(
        description || 'Documentation and engineering context are available on request from our sourcing team.'
      ),
    [description]
  )
  const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'specifications', label: 'Specifications', icon: Package },
    { id: 'datasheet', label: 'Datasheet', icon: Download },
    { id: 'shipping', label: 'Shipping', icon: Truck },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'text-[#0B1F3A] bg-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#FF7A00]" />}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="p-6 md:p-8"
        >
          {active === 'description' && (
            <p
              className="text-slate-600 leading-7"
              dangerouslySetInnerHTML={{ __html: linkedDescription }}
            />
          )}
          {active === 'specifications' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 font-semibold text-slate-700">Specification</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {specEntries.map(([key, value]) => (
                    <tr key={key} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-slate-500">{key.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{String(value)}</td>
                    </tr>
                  ))}
                  {specEntries.length === 0 && (
                    <tr>
                      <td className="px-3 py-5 text-slate-500" colSpan={2}>
                        Full technical details available upon request
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {active === 'datasheet' && (
            <div>
              {datasheetUrl ? (
                <a
                  href={datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <Download className="h-4 w-4" />
                  Download Datasheet
                </a>
              ) : (
                <p className="text-slate-500">Datasheet will be provided with quotation response.</p>
              )}
            </div>
          )}
          {active === 'shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                Global shipping lanes with priority handling for critical production lines.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                Export docs, compliance declarations, and packaging standards available.
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
