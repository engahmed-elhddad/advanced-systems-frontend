'use client'

import { ConsentGatedAnalytics } from '@/components/analytics/ConsentGatedAnalytics'

/** Consent-gated: GA4, PostHog, first-party `/api/v1/events`, SPA `page_view`. */
export function AnalyticsClient() {
  return <ConsentGatedAnalytics />
}
