'use client'

/**
 * No per-event timeline API exists for b2b_orders; status is authoritative on the order row.
 */
export function OrderTimeline() {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">Timeline</h3>
      <p className="text-xs text-[#6B7280]">
        The API does not expose order timeline events. Use the status badge and timestamps (created /
        updated) on the order.
      </p>
    </div>
  )
}
