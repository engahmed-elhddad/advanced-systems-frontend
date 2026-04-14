import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showLabel?: boolean
  /** `dark` matches admin glass shell */
  variant?: 'default' | 'dark'
}

const btnDefault =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-35'
const btnDark =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/[0.14] disabled:pointer-events-none disabled:opacity-35'

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  showLabel = true,
  variant = 'default',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const btn = variant === 'dark' ? btnDark : btnDefault
  const labelCls =
    variant === 'dark' ? 'min-w-[8.5rem] px-3 text-sm tabular-nums text-white/70' : 'min-w-[8.5rem] px-3 text-sm tabular-nums text-slate-600'

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={btn}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {showLabel ? <span className={labelCls}>Page {page} of {totalPages}</span> : null}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={btn}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
