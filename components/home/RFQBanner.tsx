'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export function RFQBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/50">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative px-6 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Can&apos;t find your part?
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
          Send a request for quote and our engineers will help you source it.
        </p>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold shadow-lg shadow-accent-900/25 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Request Quote
        </Link>
      </div>
    </section>
  )
}
