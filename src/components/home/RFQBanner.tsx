'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function RFQBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(255,122,0,0.08)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-orange-500/[0.15] blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-purple-600/[0.12] blur-[90px]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />
      <div className="relative px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-12 lg:py-16">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          Can&apos;t find your part?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-base text-white/65 sm:text-lg">
          Tell us what you need — typical pricing within a few hours. No commitment.
        </p>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/35 transition-all duration-300 hover:scale-[1.04] hover:brightness-110 hover:shadow-xl hover:shadow-orange-500/45"
        >
          <Zap className="h-4 w-4" />
          Get price in 2 hours
        </Link>
        <p className="mt-4 text-[11px] text-white/40">Typical response: 2–4 hours · No commitment required</p>
      </div>
    </section>
  )
}
