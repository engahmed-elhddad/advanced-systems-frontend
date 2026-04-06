'use client'

import { useRouter } from 'next/navigation'
import { SearchBar } from '@/features/search/components/SearchBar'
import { Cpu } from 'lucide-react'

const EXAMPLE_QUERIES = [
  '6ES7400-1PB00-0AA0',
  '3RT1015',
  'Siemens PLC',
]

export function HeroSearch() {
  const router = useRouter()

  return (
    <section className="relative min-h-[480px] sm:min-h-[540px] flex flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative page-container py-14 sm:py-18">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-xs font-medium uppercase tracking-wider mb-6">
            <Cpu className="w-4 h-4" />
            Industrial Automation Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 leading-tight">
            Find Industrial Parts
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Search by part number, manufacturer or description. PLCs, drives, sensors and more.
          </p>

          <div className="max-w-3xl mx-auto mb-6">
            <SearchBar
              placeholder="Search by part number (e.g. 6ES7400-1PB00-0AA0)"
              size="lg"
              showSuggestions
              debounceMs={300}
            />
          </div>

          <p className="text-slate-400 text-sm">
            Try:{' '}
            {EXAMPLE_QUERIES.map((q, i) => (
              <span key={q}>
                <button
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
                  className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
                >
                  {q}
                </button>
                {i < EXAMPLE_QUERIES.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
