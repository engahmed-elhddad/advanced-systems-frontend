import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
  className?: string
  variant?: 'primary' | 'accent'
}

export function FilterChip({ label, value, onRemove, className, variant = 'primary' }: FilterChipProps) {
  const isAccent = variant === 'accent'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
        isAccent
          ? 'bg-accent-50 border border-accent-200 text-accent-700'
          : 'bg-primary-50 border border-primary-200 text-primary-700',
        className
      )}
    >
      {label}: {value}
      <button
        type="button"
        onClick={onRemove}
        className={cn('ml-0.5 transition-colors', isAccent ? 'hover:text-accent-800' : 'hover:text-primary-800')}
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}
