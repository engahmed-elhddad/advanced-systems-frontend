import * as React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-20 bg-gray-50 rounded-xl border border-gray-200',
        className
      )}
    >
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
