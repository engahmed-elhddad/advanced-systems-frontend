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
          <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-[#0B1F3A]">
            {label}
            {required ? <span className="text-red-500"> *</span> : null}
          </label>
        ) : null}

        <div
          className={cn(
            'flex h-12 items-center rounded-xl border bg-white px-4 transition-all duration-300',
            error ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300',
            'focus-within:border-[#FF7A00] focus-within:ring-4 focus-within:ring-[#FF7A00]/15',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          {leftIcon ? <span className="mr-2 text-gray-400">{leftIcon}</span> : null}
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
              'h-full w-full border-0 bg-transparent text-sm text-[#0B1F3A] outline-none placeholder:text-gray-400',
              className
            )}
            {...props}
          />
          {rightIcon ? <span className="ml-2 text-gray-400">{rightIcon}</span> : null}
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helpId} className="mt-1.5 text-xs text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
