'use client'

import type { OrderTimelineEvent } from '@/services/adminService'

interface OrderTimelineProps {
  events: OrderTimelineEvent[]
  loading: boolean
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

export function OrderTimeline({ events, loading }: OrderTimelineProps) {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Timeline</h3>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-[2px] bg-[#F3F4F6]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-[#6B7280]">No timeline events yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0072CE]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{event.title}</p>
                {event.message ? (
                  <p className="text-xs text-[#6B7280]">{event.message}</p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                  {formatDate(event.created_at)}
                  {event.actor ? ` • ${event.actor}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

