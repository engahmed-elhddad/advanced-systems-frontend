import Link from 'next/link'
import { FileText } from 'lucide-react'
import { CATEGORIES } from '@/app/lib/constants'

export default function DatasheetLibraryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">
            ← Knowledge Hub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Datasheet Library
          </h1>
          <p className="text-slate-600 mt-2">
            Browse technical datasheets by category. Each category links to products with available PDF datasheets.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/search?category=${encodeURIComponent(c.slug)}`}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                {c.icon}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{c.name}</h2>
                <p className="text-sm text-slate-600">{c.description}</p>
                <span className="text-xs text-primary-600 font-medium mt-1 inline-block">
                  Browse {c.name} products →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-xl border border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-900 mb-2">Find datasheets by part number</h3>
          <p className="text-sm text-slate-600 mb-4">
            Use our search or product finder to locate a specific part. Product pages include datasheet downloads when available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm"
            >
              Search parts
            </Link>
            <Link
              href="/product-finder"
              className="px-4 py-2 rounded-lg border border-slate-200 hover:border-primary-500 text-slate-700 font-medium text-sm"
            >
              Find by specs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
