'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { Cpu, Zap, Shield, Truck } from 'lucide-react'

export function HeroSection() {
  const router = useRouter()

  const exampleSearches = [
    { q: '3RT1015', label: 'Contactors' },
    { q: 'Siemens PLC', label: 'PLCs' },
    { q: 'Omron sensor', label: 'Sensors' },
  ]

  return (
    <section className="relative min-h-[520px] sm:min-h-[580px] flex flex-col justify-center overflow-hidden">
      {/* Industrial dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent" />

      <div className="relative page-container py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium uppercase tracking-wider mb-6">
            <Cpu className="w-4 h-4" />
            Industrial Automation Platform
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 leading-tight">
            The Industrial Parts
            <br />
            <span className="text-primary-400">Search Engine</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Search part numbers, manufacturers and specifications. PLCs, drives, sensors — from 500+ brands.
          </p>

          {/* Large search bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <SearchBar
              placeholder="Enter part number, brand or description…"
              size="lg"
              showSuggestions
            />
          </div>

          <p className="text-slate-400 text-sm mb-8">
            Try:{' '}
            {exampleSearches.map((ex, i) => (
              <span key={ex.q}>
                <button
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(ex.q)}`)}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  {ex.q}
                </button>
                {i < exampleSearches.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              <span>Fast quotes</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span>Verified suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-500" />
              <span>Global shipping</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/product-finder"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-primary-500/50 hover:text-primary-400 hover:bg-primary-500/5 transition-colors text-sm font-medium"
            >
              Find by specs
            </Link>
            <Link
              href="/rfq/instant"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors"
            >
              Instant RFQ
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
