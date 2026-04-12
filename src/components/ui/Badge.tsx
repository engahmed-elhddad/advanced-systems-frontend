import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'closed'
  | 'info'
  | 'pending'
  | 'warning'
  | 'success'
  | 'error'
  | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-white/15 bg-white/10 text-white/90 shadow-[0_0_20px_rgba(255,255,255,0.06)]',
  new: 'border-blue-400/35 bg-blue-500/15 text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.2)]',
  contacted: 'border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.15)]',
  quoted: 'border-violet-400/40 bg-violet-500/15 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.2)]',
  closed: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.18)]',
  info: 'border-blue-400/35 bg-blue-500/15 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  pending: 'border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.12)]',
  warning: 'border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.12)]',
  success: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  error: 'border-red-400/40 bg-red-500/15 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  danger: 'border-red-400/40 bg-red-500/15 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
} as const

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: keyof typeof sizeClasses
  dot?: boolean
  /** @deprecated Tones merged — dark glass only */
  tone?: 'light' | 'dark'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, tone: _tone, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border font-semibold backdrop-blur-sm transition-all duration-300',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot ? <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-90 shadow-[0_0_8px_currentColor]" aria-hidden /> : null}
      {children}
    </span>
  )
)

Badge.displayName = 'Badge'
