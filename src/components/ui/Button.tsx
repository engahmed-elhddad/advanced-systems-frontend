'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-gradient-to-r from-[#FF7A00] to-[#FF5500] font-semibold text-white shadow-lg shadow-orange-500/25',
    'transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-orange-500/35',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
  ),
  secondary: cn(
    'border border-white/15 bg-white/10 font-semibold text-white backdrop-blur-md',
    'transition-all duration-300 hover:scale-[1.03] hover:border-white/25 hover:bg-white/[0.12] hover:shadow-lg hover:shadow-purple-500/10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
  ),
  ghost: cn(
    'font-semibold text-white/85 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:text-white',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]',
    'disabled:pointer-events-none disabled:opacity-45'
  ),
  outline: cn(
    'border border-white/20 bg-transparent font-semibold text-white',
    'transition-all duration-300 hover:scale-[1.03] hover:border-orange-400/50 hover:bg-white/5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]',
    'disabled:pointer-events-none disabled:opacity-45'
  ),
  destructive: cn(
    'bg-gradient-to-r from-red-600 to-red-500 font-semibold text-white shadow-lg',
    'transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/30',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'
  ),
}

const sizeClasses = {
  sm: 'h-9 rounded-xl px-4 py-2 text-xs',
  md: 'rounded-xl px-6 py-3 text-sm',
  lg: 'rounded-xl px-8 py-3.5 text-base min-h-[52px]',
} as const

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: keyof typeof sizeClasses
  loading?: boolean
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  /** @deprecated Ignored — single dark glass theme */
  surface?: 'light' | 'dark'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      type = 'button',
      surface: _surface,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = Boolean(disabled || loading)
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        type={asChild ? undefined : type}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span className="invisible inline-flex items-center gap-2">
              {leftIcon}
              {children}
              {rightIcon}
            </span>
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
