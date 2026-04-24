'use client'

/**
 * No per-event timeline API exists for b2b_orders; status is authoritative on the order row.
 */
export function OrderTimeline() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-2 text-sm font-semibold text-white">Timeline</h3>
      <p className="text-xs text-white/50">
        The API does not expose order timeline events. Use the status badge and timestamps (created /
        updated) on the order.
      </p>
    </div>
  )
}
