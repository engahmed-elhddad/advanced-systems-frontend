import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered'
  hover?: boolean
  asChild?: boolean
}

const variantClasses = {
  default: 'bg-white border border-gray-200 shadow-soft',
  elevated: 'bg-white shadow-card border border-transparent',
  bordered: 'bg-white border-2 border-gray-200',
}

export function Card({
  variant = 'default',
  hover = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-250',
        variantClasses[variant],
        hover && 'hover:shadow-card hover:border-gray-300',
        className
      )}
      {...props}
    />
  )
}
