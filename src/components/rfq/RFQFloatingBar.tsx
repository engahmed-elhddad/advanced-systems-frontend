'use client'

import { Zap, X } from 'lucide-react'
import { useRFQListStore } from '@/state/rfqListStore'
import { useUIStore } from '@/state/uiStore'

export function RFQFloatingBar() {
  const items = useRFQListStore((s) => s.items)
  const clearList = useRFQListStore((s) => s.clear)
  const openRFQListModal = useUIStore((s) => s.openRFQListModal)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-[72px] lg:bottom-0 inset-x-0 z-40 animate-fadeIn">
      <div className="bg-white border-t border-[#E5E7EB] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-[2px] bg-[#0072CE] text-white text-xs font-bold flex-shrink-0">
              {items.length}
            </span>
            <span className="text-sm font-medium text-[#1A1A1A] truncate">
              {items.length === 1 ? '1 item added' : `${items.length} items added`}
            </span>
            <button
              type="button"
              onClick={clearList}
              className="text-[#6B7280] hover:text-[#EF4444] transition-colors duration-150 flex-shrink-0"
              aria-label="Clear RFQ list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={openRFQListModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white text-sm font-semibold shadow-sm transition-colors duration-150 flex-shrink-0"
          >
            <Zap className="w-4 h-4" />
            Get Price for All
          </button>
        </div>
      </div>
    </div>
  )
}
