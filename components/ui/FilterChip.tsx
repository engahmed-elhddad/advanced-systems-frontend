import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
  className?: string
}

export function FilterChip({ label, value, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm text-primary-700 font-medium',
        className
      )}
    >
      {label}: {value}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-primary-800 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}
