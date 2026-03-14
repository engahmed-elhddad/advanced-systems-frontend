import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'default' | 'error'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'bg-primary-50 text-primary-600 border-primary-200',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200',
  default:
    'bg-gray-100 text-gray-700 border-gray-200',
  error:
    'bg-red-50 text-red-700 border-red-200',
}

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-primary-500',
  warning: 'bg-amber-500',
  default: 'bg-gray-500',
  error: 'bg-red-500',
}

export function Badge({
  variant = 'default',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'animate-pulse',
            dotClasses[variant]
          )}
        />
      )}
      {children}
    </span>
  )
}
