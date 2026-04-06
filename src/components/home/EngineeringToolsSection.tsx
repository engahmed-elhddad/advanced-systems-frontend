import Link from 'next/link'
import { Wrench, Cpu, Ruler, Zap } from 'lucide-react'

const TOOLS = [
  { href: '/panel-builder', label: 'Panel Builder', icon: Wrench, desc: 'Design control panels' },
  { href: '/search', label: 'Catalog search', icon: Cpu, desc: 'Search parts and filters' },
  { href: '/product-finder', label: 'Find by Specs', icon: Ruler, desc: 'Filter by specifications' },
  { href: '/bom-analyzer', label: 'BOM Analyzer', icon: Zap, desc: 'Upload & analyze BOMs' },
]

export function EngineeringToolsSection() {
  return (
    <section>
      <h2 className="section-title mb-6">Engineering Tools</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-3 px-5 py-5 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md hover:bg-primary-50/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center">
                <Icon className="w-6 h-6 text-slate-600 group-hover:text-primary-600" />
              </div>
              <span className="font-semibold text-slate-900 text-sm text-center">{t.label}</span>
              <span className="text-xs text-slate-500 text-center">{t.desc}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
