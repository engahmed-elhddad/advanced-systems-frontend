'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[#FF7A00] text-white shadow-md hover:bg-[#ff8f2a] hover:shadow-lg',
        secondary:
          'border border-[#E5E7EB] bg-white text-[#0B1F3A] shadow-sm hover:border-[#d9dde6] hover:shadow-md',
        ghost: 'bg-transparent text-[#0B1F3A] hover:bg-[#F5F7FA]',
        outline: 'border border-[#E5E7EB] bg-transparent text-[#0B1F3A] hover:bg-[#F5F7FA]',
        destructive: 'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      type = 'button',
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
        className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
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
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2">
            {leftIcon}
            {children}
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
