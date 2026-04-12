'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock3, MessageCircle, Package2, User2 } from 'lucide-react'
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui'
import { useAddRFQNote, useRFQ, useRFQTimeline, useUpdateRFQ, useUpdateRFQStatus, type RfqUiStatus } from '@/features/rfq/hooks/useRFQs'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

function statusBadgeVariant(status: RfqUiStatus) {
  switch (status) {
    case 'New':
      return 'new' as const
    case 'Contacted':
      return 'contacted' as const
    case 'Quoted':
      return 'quoted' as const
    case 'Closed':
      return 'closed' as const
    default:
      return 'default' as const
  }
}

const STATUS_STEPS: RfqUiStatus[] = ['New', 'Contacted', 'Quoted', 'Closed']

export default function AdminRfqDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params?.id)
  const rfqQuery = useRFQ(id)
  const timelineQuery = useRFQTimeline(id)
  const updateStatusMutation = useUpdateRFQStatus()
  const updateRfqMutation = useUpdateRFQ()
  const addNoteMutation = useAddRFQNote()
  const rfq = rfqQuery.data
  const status = rfq?.status ?? 'New'
  const badgeVariant = statusBadgeVariant(status)
  const [newNote, setNewNote] = useState('')
  const [assigneeInput, setAssigneeInput] = useState('')

  useEffect(() => {
    setAssigneeInput(rfq?.assignedTo ?? '')
  }, [rfq?.assignedTo])

  const customerWa =
    rfq?.phone && String(rfq.phone).replace(/\D/g, '').length >= 8
      ? `https://wa.me/${String(rfq.phone).replace(/\D/g, '')}`
      : null

  const timeline = useMemo(() => timelineQuery.data ?? [], [timelineQuery.data])

  useEffect(() => {
    if (rfqQuery.isError) {
      toast.error(getApiErrorMessage(rfqQuery.error, 'Failed to load RFQ details'))
    }
  }, [rfqQuery.isError, rfqQuery.error])

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/rfqs"
              className="inline-flex items-center gap-2 text-sm text-gray-300 transition-all duration-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to RFQs
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              RFQ #{rfq?.id ?? '—'}
            </h1>
          </div>
          <Badge variant={badgeVariant}>
            {status}
          </Badge>
        </div>

        {rfqQuery.isLoading ? (
          <Card className="space-y-3 border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Skeleton className="h-5 w-36 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </Card>
        ) : !rfq ? (
          <Card className="border border-white/10 bg-white/5 p-6 text-sm text-gray-300 backdrop-blur-xl">
            RFQ not found.
          </Card>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,255,255,0.08)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
              <User2 className="h-4 w-4 text-orange-300" />
              Customer Info
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Name</dt>
                <dd className="mt-1 text-sm text-white">{rfq.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-white">{rfq.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Phone</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white">
                  <span>{rfq.phone}</span>
                  {customerWa ? (
                    <a
                      href={customerWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,255,255,0.08)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
              <Package2 className="h-4 w-4 text-orange-300" />
              Product Info
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Product</dt>
                <dd className="mt-1 text-sm text-white">{rfq.product}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Quantity</dt>
                <dd className="mt-1 text-sm text-white">{rfq.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-400">Message</dt>
                <dd className="mt-1 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-gray-100">
                  {rfq.message}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Status Actions</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_STEPS.map((s) => {
                const active = s === status
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant={active ? 'primary' : 'secondary'}
                    aria-label={`Set RFQ status to ${s}`}
                    loading={updateStatusMutation.isPending && s === status}
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({ id, status: s })
                        toast.success(`RFQ status set to ${s}`)
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, 'Failed to update RFQ status'))
                      }
                    }}
                    className={
                      active
                        ? 'shadow-[0_0_20px_rgba(255,122,0,0.35)]'
                        : 'bg-white/10 border-white/15 text-gray-100 hover:bg-white/15'
                    }
                  >
                    {s}
                  </Button>
                )
              })}
            </div>
            <div className="mt-6">
              <Input
                label="Assigned To"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                placeholder="sales@advancedsystems-int.com"
                className="bg-white/10 text-white placeholder:text-gray-400"
              />
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={updateRfqMutation.isPending}
                  onClick={async () => {
                    try {
                      await updateRfqMutation.mutateAsync({ id, assignedTo: assigneeInput.trim() })
                      toast.success('Assignee updated')
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, 'Failed to update assignee'))
                    }
                  }}
                >
                  Save Assignee
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Internal notes</h2>
            {rfq.notes?.trim() ? (
              <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-gray-200">
                {rfq.notes}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No notes yet.</p>
            )}
            <textarea
              aria-label="New RFQ note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Append a follow-up, pricing context, or next action…"
              className="mt-4 h-28 w-full rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
            />
            <div className="mt-3">
              <Button
                size="sm"
                variant="primary"
                loading={addNoteMutation.isPending}
                disabled={!newNote.trim()}
                onClick={async () => {
                  const text = newNote.trim()
                  if (!text) return
                  try {
                    await addNoteMutation.mutateAsync({ id, note: text })
                    setNewNote('')
                    toast.success('Note saved')
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, 'Failed to save note'))
                  }
                }}
              >
                Add note
              </Button>
            </div>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-300">
            <Clock3 className="h-4 w-4 text-orange-300" />
            Timeline
          </h2>
          {timelineQuery.isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
            </div>
          ) : timeline.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No timeline events yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {timeline.map((event) => (
                <div key={event.id} className="rounded-xl bg-white/[0.04] p-3 text-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.07]">
                  <p className="text-gray-100">
                    <span className="font-medium text-orange-200">{event.eventType.replaceAll('_', ' ')}</span>
                    {' · '}
                    <span className="text-gray-300">{event.actor}</span>
                  </p>
                  {event.note ? <p className="mt-1 text-gray-300">{event.note}</p> : null}
                  <p className="mt-1 text-xs text-gray-500">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
          </>
        )}
      </div>
  )
}
