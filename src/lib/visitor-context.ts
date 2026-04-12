/**
 * Anonymous visitor/session IDs + first-touch UTM (cookies + localStorage/sessionStorage).
 * Gated behind analytics consent — no IDs are minted until the user accepts.
 */

const CONSENT_KEY = 'as_analytics_consent'
const COOKIE_VISITOR = 'as_vid'
const COOKIE_SESSION = 'as_sid'
const COOKIE_UTM = 'as_utm'
const LS_VISITOR = 'as_visitor_id'
const LS_SESSION = 'as_session_id'
const SS_SESSION = 'as_session_id'

const VISITOR_MAX_AGE_SEC = 365 * 24 * 60 * 60
const UTM_MAX_AGE_SEC = 180 * 24 * 60 * 60

export type AnalyticsConsent = 'pending' | 'accepted' | 'rejected'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const hit = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  if (!hit) return null
  try {
    return decodeURIComponent(hit.slice(name.length + 1))
  } catch {
    return hit.slice(name.length + 1)
  }
}

function writeCookie(name: string, value: string, maxAgeSec?: number) {
  if (typeof document === 'undefined') return
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax']
  if (typeof maxAgeSec === 'number') parts.push(`max-age=${maxAgeSec}`)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') parts.push('Secure')
  document.cookie = parts.join('; ')
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'pending'
  const v = localStorage.getItem(CONSENT_KEY)
  if (v === 'accepted' || v === 'rejected') return v
  return 'pending'
}

export function setAnalyticsConsent(consent: 'accepted' | 'rejected') {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_KEY, consent)
  if (consent === 'rejected') {
    deleteCookie(COOKIE_VISITOR)
    deleteCookie(COOKIE_SESSION)
    deleteCookie(COOKIE_UTM)
    try {
      localStorage.removeItem(LS_VISITOR)
      sessionStorage.removeItem(SS_SESSION)
    } catch {
      /* ignore */
    }
  }
}

export type UtmAttribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

function parseUtmCookie(): UtmAttribution {
  const raw = readCookie(COOKIE_UTM)
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const out: UtmAttribution = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 255)
    }
    return out
  } catch {
    return {}
  }
}

function utmFromUrl(): UtmAttribution {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: UtmAttribution = {}
  const s = params.get('utm_source')?.trim()
  const m = params.get('utm_medium')?.trim()
  const c = params.get('utm_campaign')?.trim()
  if (s) out.utm_source = s.slice(0, 255)
  if (m) out.utm_medium = m.slice(0, 255)
  if (c) out.utm_campaign = c.slice(0, 255)
  return out
}

/** Persist first-touch UTM (cookie) when URL contains params and cookie is still empty. */
export function captureFirstTouchUtm() {
  if (getAnalyticsConsent() !== 'accepted') return
  const existing = parseUtmCookie()
  if (existing.utm_source || existing.utm_medium || existing.utm_campaign) return
  const fromUrl = utmFromUrl()
  if (!fromUrl.utm_source && !fromUrl.utm_medium && !fromUrl.utm_campaign) return
  writeCookie(COOKIE_UTM, JSON.stringify(fromUrl), UTM_MAX_AGE_SEC)
}

/** Mint visitor + session IDs; call after consent = accepted. */
export function ensureTrackingIdentity() {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'accepted') return

  let visitor =
    readCookie(COOKIE_VISITOR) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(LS_VISITOR) : null)
  if (!visitor) {
    visitor = crypto.randomUUID()
  }
  writeCookie(COOKIE_VISITOR, visitor, VISITOR_MAX_AGE_SEC)
  try {
    localStorage.setItem(LS_VISITOR, visitor)
  } catch {
    /* ignore */
  }

  let sessionId = sessionStorage.getItem(SS_SESSION) || readCookie(COOKIE_SESSION)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }
  sessionStorage.setItem(SS_SESSION, sessionId)
  writeCookie(COOKIE_SESSION, sessionId)

  captureFirstTouchUtm()
}

export function getVisitorId(): string | null {
  if (getAnalyticsConsent() !== 'accepted') return null
  return (
    readCookie(COOKIE_VISITOR) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(LS_VISITOR) : null)
  )
}

export function getSessionId(): string | null {
  if (getAnalyticsConsent() !== 'accepted') return null
  return sessionStorage.getItem(SS_SESSION) || readCookie(COOKIE_SESSION)
}

export function getStoredUtm(): UtmAttribution {
  const c = parseUtmCookie()
  if (c.utm_source || c.utm_medium || c.utm_campaign) return c
  return utmFromUrl()
}

/** Safe fields to attach to RFQ (no PII beyond what the form already collects). */
export function getRfqAttributionPayload(): { visitor_id?: string; utm_source?: string } {
  if (getAnalyticsConsent() !== 'accepted') return {}
  const vid = getVisitorId()
  const utm = getStoredUtm()
  const out: { visitor_id?: string; utm_source?: string } = {}
  if (vid) out.visitor_id = vid
  if (utm.utm_source) out.utm_source = utm.utm_source
  return out
}
