'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, Shield, Globe } from 'lucide-react'

export function HeroSection() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const stats = [
    { icon: Zap, label: 'Products', value: '50,000+' },
    { icon: Shield, label: 'Manufacturers', value: '500+' },
    { icon: Globe, label: 'Countries Served', value: '80+' },
  ]

  return (
    <section className="relative min-h-[580px] sm:min-h-[620px] overflow-hidden bg-white">
      {/* Industrial background layers */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #374151 1px, transparent 1px),
            linear-gradient(to bottom, #374151 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 48%, #10b981 49%, #10b981 51%, transparent 52%),
            linear-gradient(225deg, transparent 48%, #10b981 49%, #10b981 51%, transparent 52%)
          `,
          backgroundSize: '96px 96px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-50/40 via-white to-white" />
      {/* Subtle circuit/automation accent */}
      <svg
        className="absolute top-0 right-0 w-1/2 max-w-xl h-full opacity-[0.04] pointer-events-none"
        viewBox="0 0 400 600"
        fill="none"
      >
        <path d="M350 80 L350 120 L380 140 L350 160 L350 200" stroke="#10b981" strokeWidth="1.5" fill="none" />
        <path d="M300 200 L340 200 L360 230 L340 260 L300 260" stroke="#10b981" strokeWidth="1" fill="none" />
        <circle cx="350" cy="80" r="3" fill="#10b981" />
        <circle cx="350" cy="200" r="3" fill="#10b981" />
        <circle cx="300" cy="260" r="2" fill="#10b981" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-1/3 max-w-sm h-1/2 opacity-[0.03] pointer-events-none"
        viewBox="0 0 300 300"
        fill="none"
      >
        <rect x="40" y="220" width="60" height="40" rx="4" stroke="#374151" strokeWidth="1" fill="none" />
        <rect x="120" y="200" width="60" height="40" rx="4" stroke="#374151" strokeWidth="1" fill="none" />
        <path d="M100 220 L120 220 M180 220 L200 220" stroke="#374151" strokeWidth="1" />
      </svg>

      <div className="relative page-container py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-soft text-gray-700 text-sm font-medium mb-8 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Industrial Automation Marketplace
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Source Industrial Parts
            <span className="block mt-2 text-primary-600">From Trusted Suppliers</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            PLCs, drives, sensors, HMIs, and automation components from leading manufacturers. 
            Instant quotes. Worldwide delivery.
          </p>

          {/* Search bar & CTA */}
          <form
            onSubmit={handleSearch}
            className="group max-w-2xl mx-auto mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-3 p-2 sm:p-2.5 bg-white rounded-2xl border border-gray-200 shadow-card hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300 focus-within:border-primary-400 focus-within:shadow-[0_8px_30px_rgba(16,185,129,0.12)] focus-within:ring-2 focus-within:ring-primary-500/20">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Part number, product name, or brand..."
                  className="w-full bg-transparent border-0 pl-12 pr-4 py-3.5 sm:py-4 text-gray-900 placeholder-gray-400 text-base
                             focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 sm:py-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-base
                           shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <p className="text-sm text-gray-500 mb-14">
            Popular: {' '}
            <button
              type="button"
              onClick={() => router.push('/search?q=Siemens+PLC')}
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
            >
              Siemens PLC
            </button>
            <span className="text-gray-300 mx-1">·</span>
            <button
              type="button"
              onClick={() => router.push('/search?q=ABB+Drive')}
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
            >
              ABB Drive
            </button>
            <span className="text-gray-300 mx-1">·</span>
            <button
              type="button"
              onClick={() => router.push('/search?q=Allen+Bradley')}
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
            >
              Allen Bradley
            </button>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 max-w-lg mx-auto pt-12 border-t border-gray-200/80">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl bg-primary-50 flex items-center justify-center
                              group-hover:bg-primary-100 group-hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]
                              transition-all duration-200">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
