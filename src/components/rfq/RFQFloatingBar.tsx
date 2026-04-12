'use client'

import { Zap, X } from 'lucide-react'
import { useRFQListStore } from '@/state/rfqListStore'
import { useUIStore } from '@/state/uiStore'
import { cn } from '@/lib/utils'

export function RFQFloatingBar() {
  const items = useRFQListStore((s) => s.items)
  const clearList = useRFQListStore((s) => s.clear)
  const openRFQListModal = useUIStore((s) => s.openRFQListModal)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-[72px] inset-x-0 z-40 animate-fade-in-up lg:bottom-4 lg:left-auto lg:right-6 lg:max-w-md lg:rounded-2xl">
      <div
        className={cn(
          'border border-white/12 bg-[#0c1528]/92 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl',
          'lg:rounded-2xl lg:border lg:shadow-[0_16px_48px_rgba(0,0,0,0.5)]'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5500] text-sm font-bold text-white shadow-lg shadow-orange-500/30">
              {items.length}
            </span>
            <span className="truncate text-sm font-semibold text-white/90">
              {items.length === 1 ? '1 part in RFQ list' : `${items.length} parts in RFQ list`}
            </span>
            <button
              type="button"
              onClick={clearList}
              className="shrink-0 rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-red-300"
              aria-label="Clear RFQ list"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={openRFQListModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/35 transition-all hover:brightness-110"
          >
            <Zap className="h-4 w-4" />
            Quote all
          </button>
        </div>
      </div>
    </div>
  )
}
