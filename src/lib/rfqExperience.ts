/**
 * Shared RFQ customer copy + status labels — keep admin ↔ public wording aligned.
 * Customer-facing surfaces use human status labels; admin tables may use formatRfqStatusLabel.
 */

import { COMPANY_BRANDS_STRIP, COMPANY_TRUST_STATEMENTS } from '@/lib/company'

/** Short headline for success screens (2–6h expectation). */
export const RFQ_EXPECTED_RESPONSE_HEADLINE =
  'We typically respond within 2–6 hours during business hours. Larger or multi-line quotes may need up to one business day.'

/** Longer reassurance (optional secondary line). */
export const RFQ_EXPECTED_RESPONSE_SHORT = RFQ_EXPECTED_RESPONSE_HEADLINE

/** Shown after successful submit — email confirmation UI prep. */
export const RFQ_EMAIL_CONFIRMATION_LINE = 'We sent a confirmation to your email.'

export const RFQ_NEXT_STEPS = [
  'We review your request — part numbers, alternates, and lead time.',
  'We contact you by email (or phone if we need a quick detail).',
  'You receive a formal quotation. Your reference below always shows the latest status.',
] as const

/** Post-submit trust strip (modal + inline form success). */
export const RFQ_SUCCESS_TRUST_LINES = [
  { key: 'registered', text: COMPANY_TRUST_STATEMENTS[0] },
  { key: 'tax', text: COMPANY_TRUST_STATEMENTS[1] },
  { key: 'response', text: 'Average response time: 2–6 hours' },
] as const

/** Typographic social proof — subtle partner/supply context (no logo assets required). */
export const RFQ_TRUST_BRAND_NAMES = COMPANY_BRANDS_STRIP

export const RFQ_URGENT_HELP_HEADLINE = 'Need urgent help? Contact us directly'

export const RFQ_SUCCESS_FOOTER_PILLARS = [
  { key: 'secure', text: 'Secure inquiry' },
  { key: 'nospam', text: 'No spam' },
  { key: 'expert', text: 'Expert support' },
] as const

/** Timeline stage titles (account tracking). */
export const RFQ_TIMELINE_LABELS = {
  submitted: 'Submitted',
  contacted: 'Contacted',
  quoted: 'Quoted',
  closed: 'Closed',
} as const

export type RfqTimelineKey = keyof typeof RFQ_TIMELINE_LABELS

export type RfqTimelineStep = {
  key: RfqTimelineKey
  label: string
  /** User-facing timestamp for this milestone (best effort from created_at / updated_at). */
  timestampLabel: string | null
  complete: boolean
  current: boolean
}

function normalizeRfqStatus(status: string): string {
  return String(status || '')
    .trim()
    .toLowerCase()
}

/** Badge / table label — Title Case, underscores → spaces (e.g. admin). */
export function formatRfqStatusLabel(status: string): string {
  const s = normalizeRfqStatus(status).replace(/_/g, ' ')
  if (!s) return 'Unknown'
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Customer-facing status line (badges, headers).
 * Maps new/pending → Request received, etc.
 */
export function getRfqHumanStatusLabel(status: string): string {
  switch (normalizeRfqStatus(status)) {
    case 'new':
    case 'pending':
      return 'Request received'
    case 'in_progress':
    case 'contacted':
      return 'We contacted you'
    case 'quoted':
      return 'Quote sent'
    case 'closed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return formatRfqStatusLabel(status)
  }
}

/** Short customer-facing explanation for each canonical status */
export function getRfqStatusCustomerSummary(status: string): string {
  switch (normalizeRfqStatus(status)) {
    case 'pending':
    case 'new':
      return 'Your request is in our queue. We will review it shortly and reach out if anything is unclear.'
    case 'in_progress':
    case 'contacted':
      return 'Our team is working on your quote. Watch your inbox — we may follow up with a quick question.'
    case 'quoted':
      return 'Your quotation has been sent. Open the email we sent you for pricing and next steps.'
    case 'closed':
      return 'This request is complete. If you need another line or a revision, start a new quote request anytime.'
    case 'cancelled':
      return 'This reference was cancelled. Submit a new request if you still need a quote.'
    default:
      return 'Status was updated. Details are below.'
  }
}

function formatTimelineDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

type RfqTimelineInput = {
  status: string
  created_at: string
  updated_at?: string | null
}

/**
 * Four-stage timeline for customer tracking. Uses only created_at / updated_at (no per-event API).
 */
export function buildRfqTimeline(rfq: RfqTimelineInput): RfqTimelineStep[] {
  const st = normalizeRfqStatus(rfq.status)
  const created = rfq.created_at
  const updated = rfq.updated_at?.trim() ? rfq.updated_at : created

  const cancelled = st === 'cancelled'
  const contactedDone =
    cancelled ? false : ['in_progress', 'contacted', 'quoted', 'closed'].includes(st)
  const quotedDone = cancelled ? false : ['quoted', 'closed'].includes(st)
  const closedDone = st === 'closed'

  const steps: RfqTimelineStep[] = [
    {
      key: 'submitted',
      label: RFQ_TIMELINE_LABELS.submitted,
      timestampLabel: formatTimelineDate(created),
      complete: true,
      current: false,
    },
    {
      key: 'contacted',
      label: RFQ_TIMELINE_LABELS.contacted,
      timestampLabel: contactedDone ? formatTimelineDate(updated) : null,
      complete: contactedDone,
      current: false,
    },
    {
      key: 'quoted',
      label: RFQ_TIMELINE_LABELS.quoted,
      timestampLabel: quotedDone ? formatTimelineDate(updated) : null,
      complete: quotedDone,
      current: false,
    },
    {
      key: 'closed',
      label: RFQ_TIMELINE_LABELS.closed,
      timestampLabel: closedDone ? formatTimelineDate(updated) : null,
      complete: closedDone,
      current: false,
    },
  ]

  if (cancelled) {
    return steps.map((s, i) => ({
      ...s,
      complete: i === 0,
      current: false,
      timestampLabel: i === 0 ? s.timestampLabel : null,
    }))
  }

  const firstIncomplete = steps.findIndex((s) => !s.complete)
  if (firstIncomplete >= 0) {
    return steps.map((s, i) => ({
      ...s,
      current: !s.complete && i === firstIncomplete,
    }))
  }

  return steps.map((s) => ({ ...s, current: false }))
}
