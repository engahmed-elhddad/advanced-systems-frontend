'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { PostHogInit } from '@/components/providers/PostHogInit'
import { RouteVisitTracker } from '@/components/analytics/RouteVisitTracker'
import { CookieConsentBanner } from '@/components/analytics/CookieConsentBanner'
import { getAnalyticsConsent, ensureTrackingIdentity } from '@/lib/visitor-context'

/** Loads third-party + first-party analytics only after explicit opt-in. */
export function ConsentGatedAnalytics() {
  const [consent, setConsent] = useState<'unknown' | 'accepted' | 'rejected' | 'pending'>('unknown')

  useEffect(() => {
    const c = getAnalyticsConsent()
    if (c === 'accepted') {
      ensureTrackingIdentity()
      setConsent('accepted')
    } else if (c === 'rejected') {
      setConsent('rejected')
    } else {
      setConsent('pending')
    }
  }, [])

  useEffect(() => {
    function syncFromStorage() {
      const c = getAnalyticsConsent()
      if (c === 'accepted') {
        ensureTrackingIdentity()
        setConsent('accepted')
      } else if (c === 'rejected') setConsent('rejected')
      else setConsent('pending')
    }
    function onStorage(e: StorageEvent) {
      if (e.key !== 'as_analytics_consent') return
      syncFromStorage()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('as-consent-change', syncFromStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('as-consent-change', syncFromStorage)
    }
  }, [])

  return (
    <>
      {consent === 'accepted' ? (
        <>
          <GoogleAnalytics />
          <PostHogInit />
          <RouteVisitTracker />
        </>
      ) : null}
      <CookieConsentBanner />
    </>
  )
}
