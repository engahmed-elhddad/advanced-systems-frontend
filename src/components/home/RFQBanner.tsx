'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function RFQBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-[2px] bg-[#1A1A1A] border border-[#E5E7EB]/10">
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
        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-6">
          Tell us what you need and get pricing within 2 hours.
        </p>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold shadow-sm transition-colors duration-150"
        >
          <Zap className="w-4 h-4" />
          Get Price in 2 Hours
        </Link>
        <p className="text-[11px] text-white/40 mt-3">
          Typical response: 2–4 hours &middot; No commitment required
        </p>
      </div>
    </section>
  )
}
