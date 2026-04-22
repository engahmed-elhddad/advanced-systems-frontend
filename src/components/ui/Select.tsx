'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectAddNew {
  label: string
  onClick: () => void
}

export interface SelectProps {
  label?: string
  name?: string
  options: SelectOption[]
  error?: string
  helperText?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  searchable?: boolean
  id?: string
  className?: string
  /** Merged onto the trigger (e.g. compact toolbar height). */
  triggerClassName?: string
  /** Light slate fields (e.g. legacy add-product on bg-slate-50). Default uses CSS shell variables. */
  variant?: 'shell' | 'light'
  /** Footer action (e.g. “+ Add new”) — does not change the selected value */
  addNew?: SelectAddNew
}

const shellTrigger =
  'flex h-[42px] w-full items-center justify-between rounded-[var(--radius-3)] border bg-[var(--color-input-background)] px-3 text-left text-[length:var(--text-14)] text-[var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] data-[placeholder]:text-[var(--color-foreground-muted)]'
const shellBorderOk = 'border-[var(--color-border)]'
const shellBorderErr = 'border-[var(--color-destructive)]'
const shellContent =
  'relative z-[var(--z-dropdown)] max-h-[min(18rem,var(--radix-select-content-available-height))] overflow-hidden rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background-secondary)] py-1 shadow-[var(--shadow-md)]'
const shellItem =
  'relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-2 pl-3 pr-8 text-sm text-[var(--color-foreground)] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--color-background-tertiary)]'

const lightTrigger =
  'flex h-[42px] w-full items-center justify-between rounded-lg border border-slate-200/90 bg-slate-50 px-3 text-left text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 data-[placeholder]:text-slate-500'
const lightBorderOk = 'border-slate-200/90'
const lightBorderErr = 'border-red-400'
const lightContent =
  'relative z-[var(--z-dropdown)] max-h-[min(18rem,var(--radix-select-content-available-height))] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg'
const lightItem =
  'relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-2 pl-3 pr-8 text-sm text-slate-900 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100'

export function Select({
  label,
  name,
  options,
  error,
  helperText,
  placeholder = 'Select…',
  value,
  onChange,
  disabled,
  required,
  searchable = false,
  id: idProp,
  className,
  triggerClassName,
  variant = 'shell',
  addNew,
}: SelectProps) {
  const autoId = React.useId()
  const baseId = idProp ?? name ?? autoId
  const errId = `${baseId}-error`
  const helpId = `${baseId}-help`
  const [filter, setFilter] = React.useState('')
  const searchRef = React.useRef<HTMLInputElement>(null)

  /** Radix Select.Item rejects `value=""`; drop invalid options from any caller. */
  const safeOptions = React.useMemo(
    () => options.filter((o) => (o.value ?? '').trim() !== ''),
    [options],
  )

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!searchable || !q) return safeOptions
    return safeOptions.filter((o) => o.label.toLowerCase().includes(q))
  }, [safeOptions, filter, searchable])

  const describedBy =
    [error ? errId : null, !error && helperText ? helpId : null].filter(Boolean).join(' ') || undefined

  const rootValue = value && safeOptions.some((o) => o.value === value) ? value : undefined

  const isLight = variant === 'light'
  const tCls = isLight ? lightTrigger : shellTrigger
  const okB = isLight ? lightBorderOk : shellBorderOk
  const errB = isLight ? lightBorderErr : shellBorderErr
  const cCls = isLight ? lightContent : shellContent
  const iCls = isLight ? lightItem : shellItem

  return (
    <div className={cn('relative w-full', className)}>
      {label ? (
        <label
          id={`${baseId}-label`}
          htmlFor={baseId}
          className={cn(
            'mb-1 block text-sm font-medium',
            isLight ? 'text-slate-700' : 'text-[var(--color-foreground)]'
          )}
        >
          {label}
          {required ? (
            <span className={isLight ? 'text-red-500' : 'text-[var(--color-destructive)]'}> *</span>
          ) : null}
        </label>
      ) : null}
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <SelectPrimitive.Root
        value={rootValue}
        onValueChange={(v) => {
          onChange(v)
          setFilter('')
        }}
        disabled={disabled}
        onOpenChange={(open) => {
          if (open && searchable) {
            setTimeout(() => searchRef.current?.focus(), 0)
          }
          if (!open) setFilter('')
        }}
      >
        <SelectPrimitive.Trigger
          id={baseId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(tCls, error ? errB : okB, disabled && 'pointer-events-none cursor-not-allowed opacity-50', triggerClassName)}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon aria-hidden>
            <ChevronDown className={cn('h-4 w-4 shrink-0', isLight ? 'text-slate-500' : 'text-[var(--color-foreground-muted)]')} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal container={typeof document !== 'undefined' ? document.body : undefined}>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(cCls, 'w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]')}
            onCloseAutoFocus={(e) => {
              if (searchable) e.preventDefault()
            }}
          >
            {searchable ? (
              <div
                className={cn(
                  'sticky top-0 border-b p-2',
                  isLight ? 'border-slate-200 bg-white' : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]'
                )}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  ref={searchRef}
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter…"
                  className={cn(
                    'w-full rounded-md border px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2',
                    isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-sky-500/40'
                      : 'border-[var(--color-border)] bg-[var(--color-input-background)] text-[var(--color-foreground)] focus-visible:ring-[var(--color-ring)]'
                  )}
                  aria-label="Filter options"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : null}

            <SelectPrimitive.Viewport className="max-h-[min(16rem,280px)] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div
                  className={cn('px-3 py-2 text-sm', isLight ? 'text-slate-500' : 'text-[var(--color-foreground-muted)]')}
                >
                  No matches
                </div>
              ) : (
                filtered.map((opt) => (
                  <SelectPrimitive.Item key={opt.value} value={opt.value} disabled={opt.disabled} className={iCls}>
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                      <Check className={cn('h-4 w-4', isLight ? 'text-sky-600' : 'text-[var(--color-primary)]')} aria-hidden />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))
              )}
            </SelectPrimitive.Viewport>

            {addNew ? (
              <div
                className={cn(
                  'border-t p-1',
                  isLight ? 'border-slate-200' : 'border-[var(--color-border)]'
                )}
              >
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-sm px-3 py-2 text-left text-sm font-medium transition-colors',
                    isLight
                      ? 'text-sky-700 hover:bg-slate-50'
                      : 'text-[var(--color-primary)] hover:bg-[var(--color-background-tertiary)]'
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    addNew.onClick()
                  }}
                >
                  {addNew.label}
                </button>
              </div>
            ) : null}
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error ? (
        <p
          id={errId}
          role="alert"
          aria-live="polite"
          className={cn('mt-1 text-sm', isLight ? 'text-red-600' : 'text-[var(--color-destructive)]')}
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helpId}
          className={cn('mt-1 text-sm', isLight ? 'text-slate-500' : 'text-[var(--color-foreground-muted)]')}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
