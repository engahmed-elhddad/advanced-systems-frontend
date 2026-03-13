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
    <section className="relative min-h-[620px] sm:min-h-[680px] overflow-hidden bg-white">
      {/* Industrial grid + automation background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #374151 1px, transparent 1px),
            linear-gradient(to bottom, #374151 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Diagonal accent lines - PLC/circuit feel */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 49.5%, #22c55e 50%, #22c55e 50.5%, transparent 51%),
            linear-gradient(225deg, transparent 49.5%, #22c55e 50%, #22c55e 50.5%, transparent 51%)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-industrial-green-50/60 via-white to-white" />

      {/* Robot arm / control panel SVG accent - left side */}
      <svg className="absolute top-20 left-0 w-72 h-96 opacity-[0.05] pointer-events-none" viewBox="0 0 288 384" fill="none">
        <rect x="40" y="180" width="80" height="60" rx="4" stroke="#374151" strokeWidth="2" fill="none" />
        <rect x="160" y="120" width="80" height="60" rx="4" stroke="#374151" strokeWidth="2" fill="none" />
        <path d="M120 210 L140 210 L160 170 L180 170" stroke="#374151" strokeWidth="1.5" fill="none" />
        <circle cx="80" cy="210" r="8" stroke="#22c55e" strokeWidth="2" fill="none" />
        <circle cx="200" cy="150" r="6" stroke="#22c55e" strokeWidth="1.5" fill="none" />
      </svg>

      {/* PLC cabinet / control system SVG - right side */}
      <svg className="absolute bottom-10 right-0 w-80 h-64 opacity-[0.05] pointer-events-none" viewBox="0 0 320 256" fill="none">
        <rect x="120" y="60" width="120" height="140" rx="6" stroke="#374151" strokeWidth="2" fill="none" />
        <rect x="140" y="80" width="80" height="15" rx="2" stroke="#374151" strokeWidth="1" fill="none" />
        <rect x="140" y="105" width="80" height="15" rx="2" stroke="#374151" strokeWidth="1" fill="none" />
        <rect x="140" y="130" width="80" height="15" rx="2" stroke="#374151" strokeWidth="1" fill="none" />
        <circle cx="155" cy="87" r="2" fill="#22c55e" />
        <circle cx="155" cy="112" r="2" fill="#22c55e" />
      </svg>

      <div className="relative page-container py-20 sm:py-24 md:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-industrial-gray-200 shadow-soft text-industrial-gray-700 text-sm font-semibold mb-8 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-industrial-green-500 animate-pulse" />
            Industrial Automation Marketplace
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-industrial-gray-900 leading-[1.08] tracking-tight mb-6">
            Source Industrial Parts
            <span className="block mt-2 text-industrial-green-600">From Trusted Manufacturers</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-industrial-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            PLCs, drives, sensors, HMIs, control panels & automation components. 
            Instant quotes. Worldwide delivery.
          </p>

          {/* Industrial part search bar */}
          <form onSubmit={handleSearch} className="group max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3 p-2.5 sm:p-3 bg-white rounded-2xl border-2 border-industrial-gray-200 shadow-card hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-industrial-gray-300 transition-all duration-300 focus-within:border-industrial-green-500 focus-within:shadow-[0_8px_32px_rgba(34,197,94,0.15)] focus-within:ring-2 focus-within:ring-industrial-green-500/20">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-industrial-gray-400 group-focus-within:text-industrial-green-600 transition-colors pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search part numbers (Siemens, Omron, Allen Bradley)"
                  className="w-full bg-transparent border-0 pl-12 pr-4 py-3.5 sm:py-4 text-industrial-gray-900 placeholder-industrial-gray-400 text-base font-medium
                             focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 sm:py-4 rounded-xl bg-industrial-green-600 hover:bg-industrial-green-700 text-white font-semibold text-base
                           shadow-[0_4px_14px_rgba(34,197,94,0.35)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)]
                           hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <p className="text-sm text-industrial-gray-500 mb-14">
            Popular: {' '}
            <button type="button" onClick={() => router.push('/search?q=Siemens+PLC')} className="text-industrial-green-600 hover:text-industrial-green-700 hover:underline font-medium transition-colors">Siemens PLC</button>
            <span className="text-industrial-gray-300 mx-1">·</span>
            <button type="button" onClick={() => router.push('/search?q=ABB+Drive')} className="text-industrial-green-600 hover:text-industrial-green-700 hover:underline font-medium transition-colors">ABB Drive</button>
            <span className="text-industrial-gray-300 mx-1">·</span>
            <button type="button" onClick={() => router.push('/search?q=Allen+Bradley')} className="text-industrial-green-600 hover:text-industrial-green-700 hover:underline font-medium transition-colors">Allen Bradley</button>
            <span className="text-industrial-gray-300 mx-1">·</span>
            <button type="button" onClick={() => router.push('/search?q=Omron+Sensor')} className="text-industrial-green-600 hover:text-industrial-green-700 hover:underline font-medium transition-colors">Omron Sensor</button>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 max-w-lg mx-auto pt-12 border-t border-industrial-gray-200">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl bg-industrial-green-50 flex items-center justify-center group-hover:bg-industrial-green-100 group-hover:shadow-[0_4px_12px_rgba(34,197,94,0.2)] transition-all duration-200">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-industrial-green-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-industrial-gray-900 tabular-nums">{value}</div>
                <div className="text-xs sm:text-sm text-industrial-gray-500 mt-0.5 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
