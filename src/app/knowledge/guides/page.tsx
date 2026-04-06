import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { ENGINEERING_GUIDES } from '@/app/lib/knowledge-hub/content'

const CATEGORY_LABELS: Record<string, string> = {
  motors: 'Motors',
  plc: 'PLC',
  sensors: 'Sensors',
  electrical: 'Electrical',
  safety: 'Safety',
  general: 'General',
}

export default function GuidesListPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">
            ← Knowledge Hub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-600" />
            Engineering Guides
          </h1>
          <p className="text-slate-600 mt-2">
            Technical guides for motor control, contactors, sensors, PLC wiring, and industrial automation.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <ul className="space-y-4">
          {ENGINEERING_GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/knowledge/guides/${g.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[g.category] || g.category}
                </span>
                <h2 className="text-lg font-semibold text-slate-900 mt-2 group-hover:text-primary-600">
                  {g.title}
                </h2>
                <p className="text-slate-600 text-sm mt-1">{g.excerpt}</p>
                {g.products && g.products.length > 0 && (
                  <p className="text-xs text-slate-500 mt-3">
                    Related: {g.products.map((p) => p.label || p.part_number).join(', ')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
