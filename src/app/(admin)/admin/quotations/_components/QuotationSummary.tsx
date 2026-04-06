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
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Items</span>
          <span className="font-medium text-[#1A1A1A]">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Subtotal</span>
          <span className="font-medium text-[#1A1A1A]">{formatCurrency(subtotal)}</span>
        </div>
        <div className="border-t border-[#E5E7EB] pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1A1A1A]">Total</span>
            <span className="text-base font-bold text-[#1A1A1A]">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

