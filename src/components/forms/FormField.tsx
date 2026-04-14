'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  id?: string
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  /** `light` = slate labels on white/slate-50 surfaces; `shell` = admin dark glass */
  variant?: 'light' | 'shell'
}

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
  variant = 'light',
}: FormFieldProps) {
  const labelCls =
    variant === 'shell'
      ? 'mb-1.5 block text-sm font-medium text-white/90'
      : 'mb-1.5 block text-sm font-medium text-slate-700'
  const hintCls = variant === 'shell' ? 'mt-1 text-sm text-white/50' : 'mt-1 text-sm text-slate-500'
  const errCls = variant === 'shell' ? 'mt-1 text-sm text-red-300' : 'mt-1 text-sm text-red-600'

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={id} className={labelCls}>
          {label}
          {required ? (
            <span className={variant === 'shell' ? 'text-orange-300' : 'text-red-500'}> *</span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className={errCls}>
          {error}
        </p>
      ) : hint ? (
        <p className={hintCls}>{hint}</p>
      ) : null}
    </div>
  )
}
