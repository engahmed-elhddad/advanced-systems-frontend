'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as adminService from '@/features/admin/services/adminService'
import type { CrmLead, CrmLeadStatus } from '@/features/admin/services/adminService'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, type DataTableColumnMeta, Badge, Button, Modal, Select } from '@/components/ui'
import { adminLightInputClass, adminLightTextareaClass, adminLightLabelClass } from '@/lib/adminFormClasses'
import toast from 'react-hot-toast'
import { LeadDetailsDrawer } from '@/app/admin/leads/LeadDetailsDrawer'
import { nextActionBadge, urgencyChipClass } from '@/features/admin/crmNextAction'

const STATUS_ORDER: CrmLeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost']

function labelStatus(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function LeadActivityTimeline({ leadId }: { leadId: number }) {
  const q = useQuery({
    queryKey: ['admin-lead-activity', leadId],
    queryFn: () => adminService.getAdminLeadActivity(leadId),
  })
  if (q.isLoading) {
    return <p className="text-xs text-white/50">Loading activity…</p>
  }
  if (q.isError) {
    return <p className="text-xs text-red-600">Could not load activity.</p>
  }
  const data = q.data
  if (!data) return null
  type Merged =
    | { kind: 'event'; at: string; label: string; sub?: string }
    | { kind: 'rfq'; at: string; label: string; sub?: string }
  const merged: Merged[] = [
    ...data.events.map((e) => ({
      kind: 'event' as const,
      at: e.occurred_at,
      label: e.type.replace(/_/g, ' '),
      sub: e.country ? `${e.country}` : undefined,
    })),
    ...data.rfqs.map((r) => ({
      kind: 'rfq' as const,
      at: r.created_at,
      label: `RFQ ${r.reference}`,
      sub: `${r.part_number} × ${r.quantity}`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  if (merged.length === 0) {
    return <p className="text-xs text-white/50">No activity rows yet.</p>
  }

  return (
    <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04] p-2 text-xs">
      {merged.slice(0, 20).map((row, i) => (
        <li key={`${row.kind}-${i}`} className="border-b border-white/[0.06] pb-2 last:border-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium capitalize text-white">{row.label}</span>
            <time className="shrink-0 text-[10px] text-white/40" dateTime={row.at}>
              {new Date(row.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </time>
          </div>
          {row.sub ? <p className="mt-0.5 text-white/50">{row.sub}</p> : null}
        </li>
      ))}
    </ul>
  )
}

const inputClass = adminLightInputClass
const textareaClass = adminLightTextareaClass
const labelClass = adminLightLabelClass

const SORT_OPTIONS: { value: adminService.AdminLeadSort; label: string }[] = [
  { value: 'score_desc', label: 'Score · high → low' },
  { value: 'created_at_desc', label: 'Created · newest first' },
  { value: 'last_activity_desc', label: 'Last activity · recent first' },
  { value: 'last_activity_asc', label: 'Last activity · stale first' },
]

type FormState = {
  name: string
  company: string
  role: string
  phone: string
  email: string
  source: string
  status: CrmLeadStatus
  notes: string
  rfq_reference: string
  visitor_id: string
}

const emptyForm: FormState = {
  name: '',
  company: '',
  role: '',
  phone: '',
  email: '',
  source: '',
  status: 'new',
  notes: '',
  rfq_reference: '',
  visitor_id: '',
}

function priorityRowClass(row: CrmLead & Record<string, unknown>): string | undefined {
  const pri = ((row.lead_priority || row.lead_classification || 'cold') as string).toLowerCase()
  const base = 'border-l-2 transition-shadow duration-300'
  let tier: string
  if (pri === 'hot') {
    tier = `${base} border-l-orange-500 bg-gradient-to-r from-orange-500/[0.12] to-transparent shadow-[inset_0_0_0_1px_rgba(249,115,22,0.12),0_0_28px_rgba(249,115,22,0.14)]`
  } else if (pri === 'warm') {
    tier = `${base} border-l-amber-400 bg-gradient-to-r from-amber-400/[0.1] to-transparent shadow-[inset_0_0_0_1px_rgba(234,179,8,0.1),0_0_22px_rgba(234,179,8,0.1)]`
  } else {
    tier = `${base} border-l-white/10 bg-transparent shadow-none`
  }
  if (row.needs_attention === true) {
    return `${tier} ring-1 ring-inset ring-red-500/45 bg-red-950/20`
  }
  return tier
}

const LEADS_SORT_STORAGE_KEY = 'admin-leads-sort-v1'
const LEADS_PAGE_SIZE = 50

function isValidEmailOptional(value: string): boolean {
  const t = value.trim()
  if (!t) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

function readStoredLeadSort(): adminService.AdminLeadSort {
  if (typeof window === 'undefined') return 'score_desc'
  try {
    const raw = sessionStorage.getItem(LEADS_SORT_STORAGE_KEY)
    if (
      raw === 'score_desc' ||
      raw === 'last_activity_desc' ||
      raw === 'last_activity_asc' ||
      raw === 'created_at_desc'
    ) {
      return raw
    }
  } catch {
    /* ignore */
  }
  return 'score_desc'
}

export default function AdminLeadsPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [leadsPage, setLeadsPage] = useState(1)
  const [sortBy, setSortBy] = useState<adminService.AdminLeadSort>(() => readStoredLeadSort())
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<CrmLead | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [drawerLeadId, setDrawerLeadId] = useState<number | null>(null)
  const [drawerSnapshot, setDrawerSnapshot] = useState<CrmLead | null>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(LEADS_SORT_STORAGE_KEY, sortBy)
    } catch {
      /* ignore */
    }
  }, [sortBy])

  useEffect(() => {
    setLeadsPage(1)
  }, [filterStatus, attentionOnly, sortBy])

  const statsQuery = useQuery({
    queryKey: ['admin-leads-stats'],
    queryFn: adminService.getAdminLeadStats,
  })

  const leadsQuery = useQuery({
    queryKey: ['admin-leads', filterStatus, sortBy, attentionOnly, leadsPage],
    queryFn: () =>
      adminService.getAdminLeads({
        status: filterStatus || undefined,
        page: leadsPage,
        size: LEADS_PAGE_SIZE,
        sort: sortBy,
        needs_attention: attentionOnly ? true : undefined,
      }),
  })

  const items = leadsQuery.data?.items ?? []
  const leadsTotal = leadsQuery.data?.total ?? 0
  const leadsTotalPages = Math.max(1, Math.ceil(leadsTotal / LEADS_PAGE_SIZE))

  const stats = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of STATUS_ORDER) m[s] = 0
    const by = statsQuery.data?.by_status ?? {}
    for (const [k, v] of Object.entries(by)) {
      m[k.toLowerCase()] = v
    }
    return m
  }, [statsQuery.data])

  const createMutation = useMutation({
    mutationFn: adminService.createAdminLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin-leads-stats'] })
      setModalMode(null)
      setForm(emptyForm)
      toast.success('Lead created')
    },
    onError: () => toast.error('Failed to create lead'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: adminService.CrmLeadUpdateInput }) =>
      adminService.updateAdminLead(id, body),
    onSuccess: (_data, { id, body }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin-leads-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-lead-activity', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', id] })
      closeModal()
      if (body?.link_latest_rfq_by_email) {
        toast.success('Linked latest RFQ by email')
      } else {
        toast.success('Lead updated')
      }
    },
    onError: () => toast.error('Failed to update lead'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteAdminLead,
    onSuccess: (_void, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin-leads-stats'] })
      if (drawerLeadId === deletedId) {
        setDrawerLeadId(null)
        setDrawerSnapshot(null)
      }
      closeModal()
      toast.success('Lead deleted')
    },
    onError: () => toast.error('Failed to delete lead'),
  })

  const closeModal = useCallback(() => {
    setModalMode(null)
    setSelected(null)
    setForm(emptyForm)
  }, [])

  const openCreate = useCallback(() => {
    setSelected(null)
    setForm(emptyForm)
    setModalMode('create')
  }, [])

  const openEdit = useCallback((lead: CrmLead) => {
    setSelected(lead)
    setForm({
      name: lead.name,
      company: lead.company ?? '',
      role: lead.role ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source ?? '',
      status: (lead.status as CrmLeadStatus) || 'new',
      notes: lead.notes ?? '',
      rfq_reference: lead.rfq_reference ?? '',
      visitor_id: lead.visitor_id ?? '',
    })
    setModalMode('edit')
  }, [])

  const openDrawer = useCallback((lead: CrmLead) => {
    setDrawerSnapshot(lead)
    setDrawerLeadId(lead.id)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerLeadId(null)
    setDrawerSnapshot(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) return
    if (!isValidEmailOptional(form.email)) {
      toast.error('Enter a valid email address or leave email empty.')
      return
    }
    const base = {
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      role: form.role.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      source: form.source.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      rfq_reference: form.rfq_reference.trim() || undefined,
      visitor_id: form.visitor_id.trim() || undefined,
    }
    if (modalMode === 'create') {
      createMutation.mutate(base)
      return
    }
    if (modalMode === 'edit' && selected) {
      updateMutation.mutate({
        id: selected.id,
        body: {
          ...base,
        },
      })
    }
  }, [form, modalMode, selected, createMutation, updateMutation])

  const linkLatestRfq = useCallback(() => {
    if (!selected) return
    updateMutation.mutate({
      id: selected.id,
      body: { link_latest_rfq_by_email: true },
    })
  }, [selected, updateMutation])

  const handleDelete = useCallback(() => {
    if (!selected || !window.confirm('Delete this lead? This cannot be undone.')) return
    deleteMutation.mutate(selected.id)
  }, [selected, deleteMutation])

  const columns: ColumnDef<CrmLead & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'contact',
        header: 'Contact',
        meta: { className: 'min-w-[200px]' } as DataTableColumnMeta,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex flex-col gap-0.5 py-0.5">
              <span className="font-semibold text-white/95">{r.name}</span>
              {r.email ? (
                <a
                  href={`mailto:${r.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-sky-300/90 hover:text-sky-200 hover:underline"
                >
                  {r.email}
                </a>
              ) : (
                <span className="text-xs text-white/35">No email</span>
              )}
            </div>
          )
        },
      },
      {
        id: 'lead_score',
        header: 'Score',
        cell: ({ row }) => {
          const r = row.original
          const score = r.lead_score
          if (score == null && !r.visitor_id && !r.rfq_id) {
            return <span className="font-mono text-sm text-white/35">—</span>
          }
          return (
            <span className="font-mono text-lg font-bold tabular-nums tracking-tight text-white">{score ?? 0}</span>
          )
        },
      },
      {
        id: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const r = row.original
          const cls = (r.lead_priority || r.lead_classification || 'cold').toString().toLowerCase()
          const label = cls === 'hot' ? 'Hot' : cls === 'warm' ? 'Warm' : 'Cold'
          const chip =
            cls === 'hot'
              ? 'bg-orange-500/20 text-orange-100 ring-orange-400/40'
              : cls === 'warm'
                ? 'bg-amber-500/15 text-amber-50 ring-amber-400/35'
                : 'bg-white/[0.08] text-white/55 ring-white/10'
          return (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${chip}`}
            >
              {label}
            </span>
          )
        },
      },
      {
        id: 'next_action',
        header: 'Next action',
        meta: { className: 'max-w-[190px]' } as DataTableColumnMeta,
        cell: ({ row }) => {
          const r = row.original
          const na = (r.next_action || r.suggested_action) as string | null | undefined
          if (!na) return <span className="text-xs text-white/35">—</span>
          const { emoji, text } = nextActionBadge(na)
          const ur = String(r.urgency || 'low').toLowerCase()
          return (
            <div className="flex flex-col gap-1 py-0.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs font-semibold leading-tight text-white/90">
                <span className="mr-1" aria-hidden>
                  {emoji}
                </span>
                {text}
              </span>
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${urgencyChipClass(ur)}`}
              >
                {ur}
              </span>
            </div>
          )
        },
      },
      {
        id: 'needs_attention',
        header: 'Attention',
        meta: { className: 'w-[130px]' } as DataTableColumnMeta,
        cell: ({ row }) => {
          const r = row.original
          return r.needs_attention === true ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Badge variant="danger" size="sm" className="whitespace-nowrap shadow-[0_0_16px_rgba(239,68,68,0.25)]">
                Needs attention
              </Badge>
            </div>
          ) : (
            <span className="text-[11px] text-white/25">—</span>
          )
        },
      },
      {
        id: 'last_activity_at',
        header: 'Last activity',
        cell: ({ row }) => {
          const r = row.original
          const raw = r.last_activity_at as string | null | undefined
          if (!raw) return <span className="text-xs text-white/35">—</span>
          return (
            <span className="whitespace-nowrap text-xs text-white/60">
              {new Date(raw).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )
        },
      },
      {
        id: 'rfq_count',
        header: 'RFQs',
        cell: ({ row }) => {
          const r = row.original
          const n = typeof r.rfq_count === 'number' ? r.rfq_count : 0
          return <span className="font-mono text-sm tabular-nums text-white/80">{n}</span>
        },
      },
    ],
    [],
  )

  const filterTabs = [{ value: '', label: 'All' }, ...STATUS_ORDER.map((s) => ({ value: s, label: labelStatus(s) }))]

  const pipelineStages = STATUS_ORDER.map((s) => ({
    status: s,
    label: labelStatus(s),
    count: stats[s] ?? 0,
  }))
  const pipelineTotal = statsQuery.data?.total ?? pipelineStages.reduce((a, x) => a + x.count, 0)

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-300/80">Sales cockpit</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Leads</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
              Mandatory pipeline status, next actions, and red alerts when execution slips. Click a row for full context.
            </p>
          </div>
          <Button variant="primary" className="shadow-lg shadow-orange-500/30" onClick={openCreate}>
            Add lead
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Pipeline</h2>
            <span className="text-xs text-white/40">
              Total leads <span className="font-mono font-semibold text-white/80">{pipelineTotal}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {pipelineStages.map((s) => (
              <button
                key={s.status}
                type="button"
                onClick={() => {
                  setAttentionOnly(false)
                  setFilterStatus(s.status)
                }}
                className={`rounded-2xl border p-4 text-left shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors ${
                  filterStatus === s.status && !attentionOnly
                    ? 'border-orange-400/50 bg-orange-500/10 ring-1 ring-orange-400/30'
                    : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]'
                }`}
              >
                <p className="text-2xl font-bold tabular-nums text-white">{s.count}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/40">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => {
                  setAttentionOnly(false)
                  setFilterStatus(tab.value)
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filterStatus === tab.value && !attentionOnly
                    ? 'bg-white/10 text-orange-200 ring-1 ring-orange-400/40'
                    : 'text-white/45 hover:bg-white/[0.05] hover:text-white/75'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAttentionOnly((v) => !v)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                attentionOnly
                  ? 'bg-red-500/20 text-red-100 ring-1 ring-red-400/50'
                  : 'text-white/45 hover:bg-white/[0.05] hover:text-white/75'
              }`}
            >
              Needs attention only
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[min(100%,280px)] sm:flex-none">
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-white/40">Sort</span>
            <div className="min-w-0 flex-1">
              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v as adminService.AdminLeadSort)}
                options={SORT_OPTIONS}
                placeholder="Sort"
                triggerClassName="h-9 min-h-0 text-xs"
              />
            </div>
          </div>
        </div>

        <DataTable
          tableId="admin-leads"
          columns={columns}
          data={items as (CrmLead & Record<string, unknown>)[]}
          isLoading={leadsQuery.isLoading}
          emptyState={
            <p className="py-10 text-center text-sm text-white/50">
              {attentionOnly
                ? 'No leads need attention in this view — great execution.'
                : filterStatus
                  ? `No leads in "${labelStatus(filterStatus)}".`
                  : 'No leads yet — add one or sync from RFQs.'}
            </p>
          }
          getRowId={(row) => String(row.id)}
          stickyHeader
          onRowClick={(row) => openDrawer(row as CrmLead)}
          getBodyRowClassName={(row) => priorityRowClass(row as CrmLead & Record<string, unknown>)}
        />

        {leadsTotal > LEADS_PAGE_SIZE ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
            <span>
              Page <span className="font-mono text-white/80">{leadsPage}</span> of{' '}
              <span className="font-mono text-white/80">{leadsTotalPages}</span>
              <span className="text-white/35"> · {leadsTotal.toLocaleString()} leads</span>
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={leadsPage <= 1 || leadsQuery.isLoading}
                onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={leadsPage >= leadsTotalPages || leadsQuery.isLoading}
                onClick={() => setLeadsPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        <p className="text-center text-[11px] text-white/35">
          Tip: Esc closes the drawer. Red row tint + badge = needs attention (stale vs next action). Attention filter scans up to 2000 leads server-side.
        </p>
      </div>

      <LeadDetailsDrawer
        leadId={drawerLeadId}
        open={drawerLeadId != null}
        onClose={closeDrawer}
        initialLead={drawerSnapshot}
        onEdit={(lead) => {
          closeDrawer()
          openEdit(lead)
        }}
      />

      {modalMode ? (
        <Modal
          open
          onClose={closeModal}
          title={modalMode === 'create' ? 'Add lead' : 'Edit lead'}
          description="Track conversations, pipeline stage, and link to an RFQ by reference or email."
        >
          <div className="max-h-[70vh] space-y-3 overflow-y-auto py-2">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Company</label>
                <input className={inputClass} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <input className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Source</label>
                <input
                  className={inputClass}
                  placeholder="LinkedIn, WhatsApp, referral…"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                />
              </div>
              <div>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as CrmLeadStatus }))}
                  options={STATUS_ORDER.map((s) => ({ value: s, label: labelStatus(s) }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Visitor ID (analytics)</label>
              <input
                className={inputClass}
                placeholder="UUID from first-party tracking — links behavioral score"
                value={form.visitor_id}
                onChange={(e) => setForm((f) => ({ ...f, visitor_id: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-white/40">
                Optional. If empty, score may still appear when a linked RFQ has a visitor_id.
              </p>
            </div>
            <div>
              <label className={labelClass}>RFQ reference</label>
              <input
                className={inputClass}
                placeholder="e.g. RFQ-20260406-AB12"
                value={form.rfq_reference}
                onChange={(e) => setForm((f) => ({ ...f, rfq_reference: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-white/40">Must match an existing RFQ reference.</p>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={textareaClass}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Conversation log, next step, objections…"
              />
            </div>

            {modalMode === 'edit' && selected ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="mb-2 text-xs font-semibold text-white/70">Quick activity</p>
                <LeadActivityTimeline leadId={selected.id} />
              </div>
            ) : null}

            {modalMode === 'edit' && selected ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                <Button type="button" variant="secondary" size="sm" onClick={linkLatestRfq} loading={updateMutation.isPending}>
                  Link latest RFQ by email
                </Button>
              </div>
            ) : null}

            {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
              <p className="text-xs text-red-500">Something went wrong. Check the form and try again.</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {modalMode === 'edit' ? (
                <Button type="button" variant="ghost" className="text-red-400 hover:text-red-300" onClick={handleDelete} loading={deleteMutation.isPending}>
                  Delete
                </Button>
              ) : null}
              <div className="ml-auto flex gap-3">
                <Button variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.name.trim()}>
                  {modalMode === 'create' ? 'Create lead' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
