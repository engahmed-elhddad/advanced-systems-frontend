import { API_BASE_URL } from '@/lib/constants'
import {
  getAnalyticsConsent,
  getSessionId,
  getStoredUtm,
  getVisitorId,
} from '@/lib/visitor-context'

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ''
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || ''
const GOOGLE_ADS_WHATSAPP_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL || ''
const GOOGLE_ADS_RFQ_SUBMIT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_RFQ_SUBMIT_LABEL || ''
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

// Enforce https at construction time (not just at call time) so the constant is
// always a safe URL regardless of what NEXT_PUBLIC_API_URL was baked in at build.
// Local API hosts (localhost / 127.0.0.1 / [::1]) keep http:// for dev convenience.
const EVENTS_ENDPOINT = (() => {
  // Trailing slash avoids 307 redirect from FastAPI (POST body can be dropped on redirect).
  const raw = `${API_BASE_URL.replace(/\/$/, '')}/api/v1/events/`
  try {
    const u = new URL(raw)
    if (
      u.protocol === 'http:' &&
      u.hostname !== 'localhost' &&
      u.hostname !== '127.0.0.1' &&
      u.hostname !== '[::1]'
    ) {
      u.protocol = 'https:'
      return u.href
    }
  } catch { /* malformed base URL — proceed with raw */ }
  return raw
})()

export const TRACKING_EVENT_NAMES = [
  'page_view',
  'search',
  'product_view',
  'pricing_view',
  'rfq_cta_click',
  'rfq_submit',
  'whatsapp_click',
  'category_view',
  'add_to_rfq',
  'click_product',
] as const

export type TrackingEventName = (typeof TRACKING_EVENT_NAMES)[number]

function stripSensitivePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const block = ['email', 'password', 'phone', 'message', 'token', 'secret']
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) {
    const lk = k.toLowerCase()
    if (block.some((b) => lk.includes(b))) continue
    if (typeof v === 'string' && v.length > 500) out[k] = `${v.slice(0, 500)}…`
    else out[k] = v
  }
  return out
}

function dispatchToBackend(eventName: TrackingEventName, payload: Record<string, unknown>) {
  if (getAnalyticsConsent() !== 'accepted') return
  const visitorId = getVisitorId()
  const sessionId = getSessionId()
  if (!visitorId || !sessionId) return

  const utm = getStoredUtm()
  const merged = stripSensitivePayload({
    ...(utm.utm_source ? { utm_source: utm.utm_source } : {}),
    ...(utm.utm_medium ? { utm_medium: utm.utm_medium } : {}),
    ...(utm.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    ...payload,
  })

  const body = JSON.stringify({
    visitor_id: visitorId,
    session_id: sessionId,
    event_name: eventName,
    payload: merged,
  })

  void fetch(EVENTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    mode: 'cors',
  }).catch(() => undefined)
}

/**
 * Central first-party event API (requires analytics consent + visitor/session IDs).
 */
export function trackEvent(eventName: TrackingEventName, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  dispatchToBackend(eventName, stripSensitivePayload({ ...(payload || {}) }))
}

function getUtmContext(): Record<string, string> {
  const u = getStoredUtm()
  const o: Record<string, string> = {}
  if (u.utm_source) o.utm_source = u.utm_source
  if (u.utm_medium) o.utm_medium = u.utm_medium
  if (u.utm_campaign) o.utm_campaign = u.utm_campaign
  return o
}

/** GA4 + PostHog + Meta custom — use for funnels and dashboards. */
export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const payload = { ...getUtmContext(), ...(data || {}) }
  const posthog = (window as unknown as { posthog?: { capture: (e: string, p: object) => void } }).posthog
  if (posthog && typeof posthog.capture === 'function') {
    posthog.capture(event, payload)
  }

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', event, payload)
  }

  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') {
    fbq('trackCustom', event, payload)
  }
}

export function trackSearch(data: { query?: string; total?: number; page?: number; has_filters?: boolean }) {
  const payload = data as Record<string, unknown>
  track('search', payload)
  trackEvent('search', payload)
  if (typeof window === 'undefined') return
  const searchTerm = (data.query ?? '').trim()
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'search', {
      search_term: searchTerm || undefined,
      ...(data.total != null ? { results_count: data.total } : {}),
      ...(data.page != null ? { page: data.page } : {}),
      ...(data.has_filters != null ? { has_filters: data.has_filters } : {}),
    })
  }
}

/** SPA route changes — one `page_view` per distinct path. */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return
  const p = path || '/'
  trackEvent('page_view', { page_path: p, ...(title ? { page_title: title } : {}) })
  track('page_view', { page_path: p, page_title: title })
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function' && GA_MEASUREMENT_ID) {
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: p,
      ...(title ? { page_title: title } : {}),
    })
  }
}

/** @deprecated Use trackPageView — kept for older callers. */
export function trackVisit() {
  if (typeof window === 'undefined') return
  trackPageView(window.location.pathname, typeof document !== 'undefined' ? document.title : undefined)
}

export type RfqCtaTrackPayload = {
  source: string
  part_number?: string
  product_id?: number | null
}

export function trackRfqCtaClick(data: RfqCtaTrackPayload) {
  if (typeof window === 'undefined') return
  const payload: Record<string, unknown> = {
    ...getUtmContext(),
    source: data.source,
    ...(data.part_number != null ? { part_number: data.part_number } : {}),
    ...(data.product_id != null ? { product_id: data.product_id } : {}),
  }
  track('rfq_cta_click', payload)
  trackEvent('rfq_cta_click', {
    source: data.source,
    ...(data.part_number != null ? { part_number: data.part_number } : {}),
    ...(data.product_id != null ? { product_id: data.product_id } : {}),
  })
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'rfq_cta_click', payload)
  }
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'rfq_cta_click', payload)
  }
}

export type RfqSubmitTrackPayload = {
  source: string
  part_number?: string
  part_numbers?: string[]
  reference?: string
  references?: string[]
  quantity?: number
  product_id?: number
}

export function trackRfqSubmit(data: RfqSubmitTrackPayload) {
  if (typeof window === 'undefined') return
  const primaryPart =
    (data.part_number && String(data.part_number).trim()) ||
    (data.part_numbers && data.part_numbers.length ? String(data.part_numbers[0]).trim() : '') ||
    undefined
  const payload: Record<string, unknown> = {
    ...getUtmContext(),
    source: data.source,
    ...(data.part_number != null ? { part_number: data.part_number } : {}),
    ...(data.part_numbers?.length ? { part_numbers: data.part_numbers, line_count: data.part_numbers.length } : {}),
    ...(data.reference ? { reference: data.reference } : {}),
    ...(data.references?.length ? { references: data.references } : {}),
    ...(data.quantity != null ? { quantity: data.quantity } : {}),
    ...(data.product_id != null ? { product_id: data.product_id } : {}),
  }

  track('rfq_submit', payload)
  trackEvent('rfq_submit', {
    source: data.source,
    ...(primaryPart ? { part_number: primaryPart } : {}),
    ...(data.reference ? { reference: data.reference } : {}),
    ...(data.quantity != null ? { quantity: data.quantity } : {}),
    ...(data.product_id != null ? { product_id: data.product_id } : {}),
  })

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', {
      currency: 'USD',
      value: 0,
      method: 'rfq_form',
      ...payload,
    })
    if (GOOGLE_ADS_ID && GOOGLE_ADS_RFQ_SUBMIT_LABEL) {
      gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_RFQ_SUBMIT_LABEL}`,
      })
    }
  }

  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') {
    fbq('track', 'SubmitApplication', { content_name: 'rfq_submit', ...payload })
  }
}

export function trackLead(data?: Record<string, unknown>) {
  track('lead', data)
  trackEvent('rfq_cta_click', { source: 'lead_intent', ...(data || {}) })
  if (typeof window === 'undefined') return
  const payload = { ...getUtmContext(), ...(data || {}) }
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', payload)
    if (GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL) {
      gtag('event', 'conversion', {
        ...payload,
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}`,
      })
    }
  }
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') fbq('track', 'Lead', payload)
}

export function trackWhatsApp(data?: Record<string, unknown>) {
  track('whatsapp_click', data)
  trackEvent('whatsapp_click', {
    ...(data?.part_number != null ? { part_number: String(data.part_number) } : {}),
  })
  if (typeof window === 'undefined') return
  const payload = { ...getUtmContext(), ...(data || {}) }
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'whatsapp_click', payload)
    if (GOOGLE_ADS_ID && GOOGLE_ADS_WHATSAPP_LABEL) {
      gtag('event', 'conversion', {
        ...payload,
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_WHATSAPP_LABEL}`,
      })
    }
  }
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') fbq('track', 'Contact', payload)
}

export function trackPricingView(data: { product_id?: number | null; part_number: string }) {
  if (typeof window === 'undefined') return
  const pn = (data.part_number || '').trim()
  if (!pn) return
  const payload: Record<string, unknown> = { part_number: pn }
  if (data.product_id != null && Number.isFinite(data.product_id)) {
    payload.product_id = data.product_id
  }
  track('pricing_view', payload)
  trackEvent('pricing_view', payload)
}

export type ProductViewPayload = {
  part_number: string
  product_id?: number | null
  slug?: string | null
}

/** PDP view — first-party, GA4 `view_item`, PostHog/Meta. */
export function trackProductView(partNumberOrPayload: string | ProductViewPayload) {
  if (typeof window === 'undefined') return
  const raw =
    typeof partNumberOrPayload === 'string'
      ? { part_number: partNumberOrPayload }
      : { ...partNumberOrPayload }
  const normalized = (raw.part_number || '').trim()
  if (!normalized) return
  const firstParty: Record<string, unknown> = { part_number: normalized }
  if (raw.product_id != null && Number.isFinite(Number(raw.product_id))) {
    firstParty.product_id = Number(raw.product_id)
  }
  if (raw.slug != null && String(raw.slug).trim()) {
    firstParty.slug = String(raw.slug).trim()
  }
  const payload = { ...getUtmContext(), ...firstParty }
  track('product_view', payload)
  trackEvent('product_view', firstParty)
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', {
      ...payload,
      items: [
        {
          item_id: normalized,
          ...(firstParty.product_id != null ? { item_variant: String(firstParty.product_id) } : {}),
        },
      ],
    })
  }
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      ...payload,
      content_ids: [normalized],
      content_type: 'product',
    })
  }
}

export type CategoryViewPayload = {
  category_id: number
  category_slug: string
  category_name: string
}

export function trackCategoryView(data: CategoryViewPayload) {
  if (typeof window === 'undefined') return
  const slug = (data.category_slug || '').trim()
  const name = (data.category_name || '').trim()
  if (!Number.isFinite(data.category_id) || data.category_id <= 0) return
  const firstParty: Record<string, unknown> = {
    category_id: data.category_id,
    category_slug: slug,
    category_name: name,
  }
  track('category_view', { ...getUtmContext(), ...firstParty })
  trackEvent('category_view', firstParty)
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'category_view', {
      ...getUtmContext(),
      category_id: String(data.category_id),
      category_slug: slug,
      category_name: name,
    })
  }
}

export type AddToRfqPayload = {
  source: string
  part_number: string
  product_id?: number | null
  quantity?: number
}

export function trackAddToRfq(data: AddToRfqPayload) {
  if (typeof window === 'undefined') return
  const pn = (data.part_number || '').trim()
  if (!pn) return
  const firstParty: Record<string, unknown> = {
    source: data.source,
    part_number: pn,
    ...(data.quantity != null ? { quantity: data.quantity } : {}),
    ...(data.product_id != null && Number.isFinite(Number(data.product_id))
      ? { product_id: Number(data.product_id) }
      : {}),
  }
  track('add_to_rfq', { ...getUtmContext(), ...firstParty })
  trackEvent('add_to_rfq', firstParty)
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'add_to_rfq', firstParty)
    gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: 0,
      items: [{ item_id: pn, quantity: data.quantity ?? 1 }],
    })
  }
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'add_to_rfq', firstParty)
  }
}

export type ClickProductPayload = {
  source: string
  part_number: string
  slug?: string | null
  product_id?: number | null
  /** e.g. product_card, recommendations, search_results */
  list_context?: string
  position?: number
  href?: string
}

export function trackClickProduct(data: ClickProductPayload) {
  if (typeof window === 'undefined') return
  const pn = (data.part_number || '').trim()
  if (!pn) return
  const firstParty: Record<string, unknown> = {
    source: data.source,
    part_number: pn,
    ...(data.slug ? { slug: String(data.slug).trim() } : {}),
    ...(data.product_id != null && Number.isFinite(Number(data.product_id))
      ? { product_id: Number(data.product_id) }
      : {}),
    ...(data.list_context ? { list_context: data.list_context } : {}),
    ...(data.position != null ? { position: data.position } : {}),
    ...(data.href ? { href: data.href.slice(0, 500) } : {}),
  }
  track('click_product', { ...getUtmContext(), ...firstParty })
  trackEvent('click_product', firstParty)
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'click_product', firstParty)
    gtag('event', 'select_item', {
      item_list_id: data.list_context || data.source,
      items: [{ item_id: pn, ...(data.position != null ? { index: data.position } : {}) }],
    })
  }
}
