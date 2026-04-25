'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function RFQBanner() {
  return (
    <section className="w-full rounded-2xl border border-[--border] bg-[--bg-surface]">
      <div className="px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-12 lg:py-16">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-[--text-primary] sm:text-3xl md:text-4xl">
          Can&apos;t find your part?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-base text-[--text-secondary] sm:text-lg">
          Tell us what you need — typical pricing within a few hours. No commitment.
        </p>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 rounded-xl bg-[--accent] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[--accent-hover]"
        >
          <Zap className="h-4 w-4" />
          Get price in 2 hours
        </Link>
        <p className="mt-4 text-[11px] text-[--text-secondary]">Typical response: 2–4 hours · No commitment required</p>
      </div>
    </section>
  )
}
