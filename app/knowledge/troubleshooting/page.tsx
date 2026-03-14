import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { TROUBLESHOOTING_GUIDES } from '@/app/lib/knowledge-hub/content'

export default function TroubleshootingListPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">
            ← Knowledge Hub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-primary-600" />
            Troubleshooting Guides
          </h1>
          <p className="text-slate-600 mt-2">
            Step-by-step solutions for common industrial automation issues.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <ul className="space-y-4">
          {TROUBLESHOOTING_GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/knowledge/troubleshooting/${g.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <h2 className="text-lg font-semibold text-slate-900">{g.title}</h2>
                <p className="text-sm text-slate-600 mt-1">Symptom: {g.symptom}</p>
                <p className="text-slate-600 text-sm mt-2">{g.excerpt}</p>
                {g.products && g.products.length > 0 && (
                  <p className="text-xs text-slate-500 mt-3">
                    Products: {g.products.map((p) => p.part_number).join(', ')}
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
