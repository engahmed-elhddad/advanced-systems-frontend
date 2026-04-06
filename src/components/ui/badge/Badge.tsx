import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        new: 'bg-blue-100 text-blue-700',
        info: 'bg-blue-100 text-blue-700',
        pending: 'bg-yellow-100 text-yellow-700',
        warning: 'bg-yellow-100 text-yellow-700',
        success: 'bg-green-100 text-green-700',
        error: 'bg-red-100 text-red-700',
        danger: 'bg-red-100 text-red-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-90" aria-hidden /> : null}
      {children}
    </span>
  )
)

Badge.displayName = 'Badge'
