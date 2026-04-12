'use client'

/**
 * b2b_orders has no notes child table; quotation-level notes live on b2b_quotations.notes.
 */
export function OrderNotes() {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">Notes</h3>
      <p className="text-xs text-[#6B7280]">
        Per-order notes are not stored in the database. Use quotation notes (linked via quotation ID) or
        your CRM.
      </p>
    </div>
  )
}
