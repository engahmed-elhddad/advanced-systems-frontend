import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showLabel?: boolean
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  showLabel = true,
}: PaginationProps) {
  if (totalPages <= 1) return null

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
        className="btn-secondary p-2 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {showLabel && (
        <span className="text-sm text-gray-500 px-4">
          Page {page} of {totalPages}
        </span>
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary p-2 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
