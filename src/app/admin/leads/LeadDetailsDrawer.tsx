'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import * as adminService from '@/features/admin/services/adminService'
import type { CrmLead, LeadActivityEventRow } from '@/features/admin/services/adminService'
import { nextActionBadge, urgencyChipClass } from '@/features/admin/crmNextAction'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { BadgeVariant } from '@/components/ui/Badge'

const glass =
  'rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl'

function labelPipeline(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function waHref(phone: string | null | undefined): string | null {
  const d = (phone || '').replace(/\D/g, '')
  if (!d) return null
  return `https://wa.me/${d}`
}

function priorityTone(pri: string): { ring: string; glow: string; badge: BadgeVariant } {
  const p = pri.toLowerCase()
  if (p === 'hot') {
    return {
      ring: 'ring-orange-500/50',
      glow: 'shadow-[0_0_40px_rgba(249,115,22,0.22)]',
      badge: 'error',
    }
  }
  if (p === 'warm') {
    return {
      ring: 'ring-amber-400/45',
      glow: 'shadow-[0_0_36px_rgba(234,179,8,0.18)]',
      badge: 'warning',
    }
  }
  return {
    ring: 'ring-white/15',
    glow: 'shadow-[0_0_24px_rgba(148,163,184,0.08)]',
    badge: 'default',
  }
}

function extractProductViews(events: LeadActivityEventRow[]) {
  const byPart = new Map<string, { at: string; count: number }>()
  for (const e of events) {
    if (e.type !== 'product_view') continue
    const pn = String((e.metadata as { part_number?: string }).part_number ?? '').trim()
    if (!pn) continue
    const t = e.occurred_at
    const prev = byPart.get(pn)
    if (!prev) {
      byPart.set(pn, { at: t, count: 1 })
    } else {
      byPart.set(pn, {
        at: new Date(t) > new Date(prev.at) ? t : prev.at,
        count: prev.count + 1,
      })
    }
  }
  return [...byPart.entries()]
    .map(([part_number, v]) => ({ part_number, last_at: v.at, views: v.count }))
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
}

function extractSearches(events: LeadActivityEventRow[]) {
  const rows: { query: string; at: string; total?: number }[] = []
  for (const e of events) {
    if (e.type !== 'search') continue
    const meta = e.metadata as { query?: string; total?: number }
    const q = String(meta.query ?? '').trim()
    if (!q) continue
    rows.push({ query: q, at: e.occurred_at, total: typeof meta.total === 'number' ? meta.total : undefined })
  }
  return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

const STATUS_BADGE: Record<string, BadgeVariant> = {
  new: 'new',
  contacted: 'contacted',
  quoted: 'quoted',
  won: 'success',
  lost: 'error',
  interested: 'info',
  rfq: 'quoted',
}

type Props = {
  leadId: number | null
  open: boolean
  onClose: () => void
  onEdit: (lead: CrmLead) => void
  initialLead: CrmLead | null
}

export function LeadDetailsDrawer({ leadId, open, onClose, onEdit, initialLead }: Props) {
  const leadQuery = useQuery({
    queryKey: ['admin-lead-detail', leadId],
    queryFn: () => adminService.getAdminLead(leadId!),
    enabled: open && leadId != null,
  })

  const activityQuery = useQuery({
    queryKey: ['admin-lead-activity', leadId],
    queryFn: () => adminService.getAdminLeadActivity(leadId!),
    enabled: open && leadId != null,
  })

  const lead = leadQuery.data ?? initialLead

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const events = activityQuery.data?.events ?? []
  const rfqs = activityQuery.data?.rfqs ?? []

  const productViews = useMemo(() => extractProductViews(events), [events])
  const searches = useMemo(() => extractSearches(events), [events])

  const mergedTimeline = useMemo(() => {
    type Row =
      | { kind: 'event'; at: string; title: string; sub?: string; meta?: string }
      | { kind: 'rfq'; at: string; title: string; sub?: string }
    const m: Row[] = [
      ...events.map((e) => ({
        kind: 'event' as const,
        at: e.occurred_at,
        title: e.type.replace(/_/g, ' '),
        sub: e.country ?? undefined,
        meta: e.type === 'product_view' ? String((e.metadata as { part_number?: string }).part_number ?? '') : undefined,
      })),
      ...rfqs.map((r) => ({
        kind: 'rfq' as const,
        at: r.created_at,
        title: `RFQ ${r.reference}`,
        sub: `${r.part_number} × ${r.quantity} · ${r.status}`,
      })),
    ]
    return m.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [events, rfqs])

  if (!open || leadId == null) return null

  const pri = (lead?.lead_priority || lead?.lead_classification || 'cold').toString().toLowerCase()
  const tone = priorityTone(pri)
  const whatsapp = waHref(lead?.phone)

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-[60] bg-[#030712]/75 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-[440px] flex-col border-l border-white/[0.09] bg-gradient-to-b from-[#070b14] via-[#060912] to-[#03050a] ${tone.glow}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-drawer-title"
      >
        <div className={`shrink-0 border-b border-white/[0.08] p-5 ring-1 ring-inset ${tone.ring}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Lead</p>
              <h2 id="lead-drawer-title" className="mt-1 truncate text-xl font-semibold tracking-tight text-white">
                {lead?.name ?? '…'}
              </h2>
              {lead?.company ? <p className="mt-0.5 truncate text-sm text-white/50">{lead.company}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    pri === 'hot'
                      ? 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/40'
                      : pri === 'warm'
                        ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/35'
                        : 'bg-white/10 text-white/60 ring-1 ring-white/10'
                  }`}
                >
                  {pri}
                </span>
                {lead?.status ? (
                  <Badge variant={STATUS_BADGE[lead.status] ?? 'default'} size="sm">
                    {labelPipeline(lead.status)}
                  </Badge>
                ) : null}
                {lead?.needs_attention ? (
                  <Badge variant="danger" size="sm" className="shadow-[0_0_12px_rgba(239,68,68,0.35)]">
                    Needs attention
                  </Badge>
                ) : null}
                {lead?.needs_follow_up ? (
                  <Badge variant="warning" size="sm">
                    Follow-up
                  </Badge>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`${glass} px-3 py-2.5`}>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Score</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-white">{lead?.lead_score ?? '—'}</p>
            </div>
            <div className={`${glass} px-3 py-2.5`}>
              <p className="text-[10px] uppercase tracking-wider text-white/40">RFQs</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-white">{lead?.rfq_count ?? 0}</p>
            </div>
          </div>

          {(() => {
            const na = lead?.next_action || lead?.suggested_action
            if (!na) return null
            const { emoji, text } = nextActionBadge(na)
            const reason = lead?.next_action_reason || lead?.suggested_action_reason
            const ur = (lead?.urgency || 'low').toString().toLowerCase()
            return (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/90" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white/95">
                      <span className="mr-1.5" aria-hidden>
                        {emoji}
                      </span>
                      {text}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${urgencyChipClass(ur)}`}
                    >
                      {ur}
                    </span>
                  </div>
                  {reason ? <p className="mt-0.5 text-xs leading-snug text-white/65">{reason}</p> : null}
                </div>
              </div>
            )
          })()}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              <Phone className="h-3.5 w-3.5" />
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {lead?.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  <Phone className="h-3.5 w-3.5 text-orange-300" />
                  Call
                </a>
              ) : null}
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/15"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              ) : null}
              {lead?.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  <Mail className="h-3.5 w-3.5 text-sky-300" />
                  Email
                </a>
              ) : null}
              {lead?.rfq_id ? (
                <Link
                  href={`/admin/rfqs/${lead.rfq_id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-500/15"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Primary RFQ
                </Link>
              ) : null}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              <Package className="h-3.5 w-3.5" />
              Products viewed
            </h3>
            <div className={`${glass} p-3`}>
              {activityQuery.isLoading ? (
                <p className="text-xs text-white/40">Loading…</p>
              ) : productViews.length === 0 ? (
                <p className="text-xs text-white/40">No product views tracked for this visitor.</p>
              ) : (
                <ul className="space-y-2">
                  {productViews.slice(0, 12).map((pv) => (
                    <li
                      key={pv.part_number}
                      className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-mono text-xs text-orange-200/90">{pv.part_number}</span>
                      <span className="shrink-0 text-[10px] text-white/40">
                        {pv.views > 1 ? `${pv.views}× · ` : ''}
                        {new Date(pv.last_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              <Search className="h-3.5 w-3.5" />
              Search queries
            </h3>
            <div className={`${glass} p-3`}>
              {activityQuery.isLoading ? (
                <p className="text-xs text-white/40">Loading…</p>
              ) : searches.length === 0 ? (
                <p className="text-xs text-white/40">No catalog searches recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {searches.slice(0, 15).map((s, i) => (
                    <li
                      key={`${s.query}-${i}`}
                      className="border-b border-white/[0.06] pb-2 last:border-0 last:pb-0"
                    >
                      <p className="text-sm text-white/85">&ldquo;{s.query}&rdquo;</p>
                      <p className="mt-0.5 text-[10px] text-white/40">
                        {new Date(s.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        {s.total != null ? ` · ${s.total} results` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </h3>
            <div className={`${glass} p-3`}>
              {activityQuery.isLoading ? (
                <p className="text-xs text-white/40">Loading…</p>
              ) : mergedTimeline.length === 0 ? (
                <p className="text-xs text-white/40">
                  No events yet
                  {activityQuery.data?.visitor_id ? (
                    <>
                      {' '}
                      (visitor <span className="font-mono">{activityQuery.data.visitor_id}</span>)
                    </>
                  ) : null}
                  .
                </p>
              ) : (
                <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {mergedTimeline.slice(0, 50).map((row, i) => (
                    <li key={`${row.kind}-${i}`} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-orange-400/80">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium capitalize text-white/90">{row.title}</span>
                        <time className="text-[10px] text-white/35" dateTime={row.at}>
                          {new Date(row.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </time>
                      </div>
                      {'sub' in row && row.sub ? <p className="mt-0.5 text-xs text-white/45">{row.sub}</p> : null}
                      {'meta' in row && row.meta ? (
                        <p className="mt-0.5 font-mono text-[11px] text-orange-200/70">{row.meta}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-white/[0.08] bg-black/20 p-4 backdrop-blur-md">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 border-white/15 bg-white/[0.06] text-white" onClick={onClose}>
              Close
            </Button>
            {lead ? (
              <Button
                variant="primary"
                className="flex-1 shadow-lg shadow-orange-500/20"
                onClick={() => lead && onEdit(lead)}
              >
                Edit lead
              </Button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}
