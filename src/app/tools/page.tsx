import Link from 'next/link'
import { FileSpreadsheet, Search, Wrench } from 'lucide-react'

export const metadata = {
  title: 'Industrial Engineering Tools | Advanced Systems',
  description: 'Component scanner, BOM analyzer, product finder and more industrial automation tools.',
}

const tools = [
  {
    title: 'BOM Upload',
    description: 'Upload Excel or CSV BOM. Match parts, get datasheets and create RFQ.',
    href: '/tools/bom-upload',
    icon: FileSpreadsheet,
  },
  {
    title: 'Product Finder',
    description: 'Filter by specifications: voltage, current, category, brand.',
    href: '/product-finder',
    icon: Search,
  },
  {
    title: 'BOM Analyzer',
    description: 'Full BOM analysis with alternatives and instant RFQ.',
    href: '/bom-analyzer',
    icon: Wrench,
  },
]

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Industrial Engineering Tools</h1>
      <p className="text-slate-600 mb-10">
        Tools for industrial automation component identification and procurement.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        {tools.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">{t.title}</h2>
                <p className="text-sm text-slate-600">{t.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
