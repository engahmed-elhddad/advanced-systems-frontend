'use client'

interface QuotationSummaryProps {
  subtotal: number
  total: number
  itemCount: number
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function QuotationSummary({ subtotal, total, itemCount }: QuotationSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/50">Items</span>
          <span className="font-medium text-white/80">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">Subtotal</span>
          <span className="font-medium text-white/80">{formatCurrency(subtotal)}</span>
        </div>
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Total</span>
            <span className="text-base font-bold text-white">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
