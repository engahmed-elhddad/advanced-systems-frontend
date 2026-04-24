'use client'

/**
 * b2b_orders has no notes child table; quotation-level notes live on b2b_quotations.notes.
 */
export function OrderNotes() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-2 text-sm font-semibold text-white">Notes</h3>
      <p className="text-xs text-white/50">
        Per-order notes are not stored in the database. Use quotation notes (linked via quotation ID) or
        your CRM.
      </p>
    </div>
  )
}
