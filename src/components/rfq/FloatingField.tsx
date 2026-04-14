'use client'

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  inputClassName?: string
}

export function FloatingInput({ label, error, id, className, inputClassName, type, ...props }: InputProps) {
  const fid = id || props.name || 'field'
  return (
    <div className={cn('relative', className)}>
      <input
        id={fid}
        type={type}
        placeholder=" "
        className={cn(
          'peer h-14 min-h-[3rem] w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 pb-2 pt-5 text-base text-white outline-none transition-all duration-200 sm:h-12 sm:min-h-0 sm:text-[15px]',
          'placeholder:text-transparent',
          'focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          type === 'password' && 'caret-white',
          inputClassName,
        )}
        {...props}
      />
      <label
        htmlFor={fid}
        className="pointer-events-none absolute left-4 top-1/2 z-[1] origin-[0] -translate-y-1/2 scale-100 text-sm text-white/45 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:scale-[0.72] peer-focus:text-orange-300/95 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:text-white/55"
      >
        {label}
      </label>
      {error ? <p className="mt-1.5 px-1 text-xs font-medium text-red-300">{error}</p> : null}
    </div>
  )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
  inputClassName?: string
}

export function FloatingTextarea({ label, error, id, className, inputClassName, ...props }: TextareaProps) {
  const fid = id || props.name || 'field'
  return (
    <div className={cn('relative', className)}>
      <textarea
        id={fid}
        placeholder=" "
        rows={4}
        className={cn(
          'peer min-h-[140px] w-full resize-y rounded-xl border border-white/15 bg-white/[0.07] px-4 pb-3 pt-7 text-base text-white outline-none transition-all duration-200 sm:min-h-[120px] sm:text-[15px]',
          'placeholder:text-transparent',
          'focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/20',
          inputClassName,
        )}
        {...props}
      />
      <label
        htmlFor={fid}
        className="pointer-events-none absolute left-4 top-6 z-[1] origin-[0] -translate-y-1/2 text-sm text-white/45 transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-3 peer-focus:translate-y-0 peer-focus:scale-[0.72] peer-focus:text-orange-300/95 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:text-white/55"
      >
        {label}
      </label>
      {error ? <p className="mt-1.5 px-1 text-xs font-medium text-red-300">{error}</p> : null}
    </div>
  )
}
