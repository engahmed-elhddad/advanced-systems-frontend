'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  id?: string
  /** @deprecated Ignored — glass field only */
  variant?: 'light' | 'dark'
  /** Larger tap target + 16px text on mobile (RFQ / lead forms). */
  comfortable?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: idProp,
      className,
      disabled,
      required,
      type = 'text',
      variant: _variant,
      comfortable,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId()
    const inputId = idProp ?? name ?? autoId
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`
    const describedBy =
      [error ? errorId : null, !error && helperText ? helpId : null].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-white/90">
            {label}
            {required ? <span className="text-orange-300"> *</span> : null}
          </label>
        ) : null}

        <div
          className={cn(
            'flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl',
            comfortable ? 'min-h-[3rem]' : 'min-h-[2.5rem]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300',
            'focus-within:border-orange-400/40 focus-within:shadow-[0_0_0_1px_rgba(255,122,0,0.25),0_0_24px_rgba(255,122,0,0.12)]',
            error ? 'border-red-400/40 ring-2 ring-red-500/25' : '',
            disabled && 'cursor-not-allowed opacity-45'
          )}
        >
          {leftIcon ? <span className="mr-2 text-white/45">{leftIcon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-full w-full min-h-0 border-0 bg-transparent text-white outline-none placeholder:text-white/40',
              type === 'password' && 'caret-white',
              comfortable ? 'min-h-[48px] text-base sm:min-h-0 sm:text-sm' : 'text-sm',
              className
            )}
            {...props}
          />
          {rightIcon ? <span className="ml-2 text-white/45">{rightIcon}</span> : null}
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-red-300" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helpId} className="mt-1.5 text-xs text-white/45">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
