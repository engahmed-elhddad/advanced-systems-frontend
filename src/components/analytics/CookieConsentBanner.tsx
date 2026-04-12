'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  ensureTrackingIdentity,
  type AnalyticsConsent,
} from '@/lib/visitor-context'

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>(() =>
    typeof window === 'undefined' ? 'pending' : getAnalyticsConsent(),
  )

  if (consent !== 'pending') return null

  function accept() {
    setAnalyticsConsent('accepted')
    ensureTrackingIdentity()
    setConsent('accepted')
    window.dispatchEvent(new Event('as-consent-change'))
  }

  function reject() {
    setAnalyticsConsent('rejected')
    setConsent('rejected')
    window.dispatchEvent(new Event('as-consent-change'))
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0a1629]/95 px-4 py-4 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:px-8"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-white/80">
          We use first-party cookies and local storage to measure anonymous traffic, attribution (e.g. UTM), and
          conversions. We do not store free-text messages or contact details in analytics. See our{' '}
          <Link href="/faq" className="text-orange-300 underline-offset-2 hover:underline">
            FAQ
          </Link>{' '}
          for more.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-[#0a1629] shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  )
}
