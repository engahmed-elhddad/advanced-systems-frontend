import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, containerClassName, ...props }, ref) => {
    const baseClasses =
      'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors ' +
      'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
    const stateClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-200 focus:bg-white'

    if (leftIcon || rightIcon) {
      return (
        <div
          className={cn(
            'flex items-center rounded-lg border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
            error && 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500',
            containerClassName
          )}
        >
          {leftIcon && (
            <span className="pl-3.5 text-gray-400 pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            className={cn(
              'flex-1 min-w-0 bg-transparent py-2.5 text-sm text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-0',
              leftIcon && 'pl-2',
              rightIcon && 'pr-2',
              !leftIcon && 'pl-4',
              !rightIcon && 'pr-4',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="pr-3.5 text-gray-400 pointer-events-none">{rightIcon}</span>
          )}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        className={cn(baseClasses, stateClasses, className)}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
