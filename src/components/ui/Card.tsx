import * as React from 'react'
import { cn } from '@/lib/utils'

/** @deprecated All surfaces are glass — prop ignored */
export type CardVariant = 'glass' | 'default' | 'elevated' | 'bordered'

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const

const glassShell = cn(
  'overflow-hidden rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-xl',
  'shadow-lg shadow-black/20 transition-all duration-300',
  'hover:scale-[1.03] hover:border-white/[0.14] hover:shadow-xl hover:shadow-orange-500/10'
)

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'aside'
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: CardVariant
  hover?: boolean
  padding?: keyof typeof paddingClasses
}

export function Card({
  as = 'div',
  header,
  footer,
  variant: _variant = 'glass',
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
        glassShell,
        !hover && 'hover:scale-100 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {header != null ? (
        <div className="border-b border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold tracking-tight text-white">
          {header}
        </div>
      ) : null}
      <div className={cn(paddingClasses[padding])}>{children}</div>
      {footer != null ? (
        <div className="border-t border-white/10 bg-white/[0.03] px-6 py-4 text-sm text-white/60">{footer}</div>
      ) : null}
    </Comp>
  )
}
