import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'aside'
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: 'bg-white border border-slate-200 shadow-md',
  bordered: 'bg-white border-2 border-slate-200 shadow-sm',
  elevated: 'bg-white border border-transparent shadow-lg',
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  as = 'div',
  header,
  footer,
  variant = 'default',
  hover = true,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const Comp = as
  return (
    <Comp
      className={cn(
        'overflow-hidden rounded-xl transition-all duration-300',
        variantClasses[variant],
        hover && 'hover:-translate-y-0.5 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {header ? <div className="border-b border-slate-200 px-6 py-4 font-semibold text-[#0B1F3A]">{header}</div> : null}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer ? <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">{footer}</div> : null}
    </Comp>
  )
}
