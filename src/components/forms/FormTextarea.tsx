'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { adminLightTextareaClass } from '@/lib/adminFormClasses'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  variant?: 'light' | 'shell'
}

const shellClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:ring-2 focus:ring-[#FF7A00]/40'

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, variant = 'light', className, id, required, ...props }, ref) => {
    const autoId = React.useId()
    const tid = id ?? autoId
    const errId = `${tid}-err`

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={tid} className={cn('mb-1.5 block text-sm font-medium', variant === 'shell' ? 'text-white/90' : 'text-slate-700')}>
            {label}
            {required ? <span className={variant === 'shell' ? 'text-orange-300' : 'text-red-500'}> *</span> : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={tid}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errId : undefined}
          className={cn(variant === 'shell' ? shellClass : adminLightTextareaClass, error && 'border-red-400/60 ring-1 ring-red-500/20', className)}
          {...props}
        />
        {error ? (
          <p id={errId} role="alert" className={cn('mt-1 text-sm', variant === 'shell' ? 'text-red-300' : 'text-red-600')}>
            {error}
          </p>
        ) : hint ? (
          <p className={cn('mt-1 text-sm', variant === 'shell' ? 'text-white/50' : 'text-slate-500')}>{hint}</p>
        ) : null}
      </div>
    )
  }
)
FormTextarea.displayName = 'FormTextarea'
