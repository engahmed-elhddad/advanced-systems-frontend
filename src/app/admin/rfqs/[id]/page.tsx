'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock3, Package2, User2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui'
import { useAddRFQNote, useRFQ, useRFQTimeline, useUpdateRFQ, useUpdateRFQStatus, type RfqUiStatus } from '@/hooks/useRFQs'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

function statusBadgeClass(status: RfqUiStatus) {
  switch (status) {
    case 'New':
      return { variant: 'new' as const, className: '' }
    case 'Contacted':
      return { variant: 'pending' as const, className: '' }
    case 'Quoted':
      return { variant: 'default' as const, className: 'bg-purple-100 text-purple-700' }
    case 'Closed':
      return { variant: 'success' as const, className: '' }
    default:
      return { variant: 'default' as const, className: '' }
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
  const badge = statusBadgeClass(status)
  const [noteInput, setNoteInput] = useState('')
  const [assigneeInput, setAssigneeInput] = useState('')

  useEffect(() => {
    setAssigneeInput(rfq?.assignedTo ?? '')
    setNoteInput(rfq?.notes ?? '')
  }, [rfq?.assignedTo, rfq?.notes])

  const timeline = useMemo(() => timelineQuery.data ?? [], [timelineQuery.data])

  useEffect(() => {
    if (rfqQuery.isError) {
      toast.error(getApiErrorMessage(rfqQuery.error, 'Failed to load RFQ details'))
    }
  }, [rfqQuery.isError, rfqQuery.error])

  return (
    <AdminLayout>
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
          <Badge variant={badge.variant} className={badge.className}>
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
                <dd className="mt-1 text-sm text-white">{rfq.phone}</dd>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Add Note</h2>
            <textarea
              aria-label="RFQ note"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add follow-up details, pricing context, or next action..."
              className="mt-4 h-32 w-full rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-500 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
            />
            <div className="mt-3">
              <Button
                size="sm"
                variant="primary"
                loading={addNoteMutation.isPending}
                onClick={async () => {
                  try {
                    await addNoteMutation.mutateAsync({ id, note: noteInput })
                    toast.success('Note saved')
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, 'Failed to save note'))
                  }
                }}
              >
                Save Note
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
                <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
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
    </AdminLayout>
  )
}
