'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
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
}

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
}: SelectProps) {
  const autoId = React.useId()
  const baseId = idProp ?? name ?? autoId
  const listId = `${baseId}-list`
  const errId = `${baseId}-error`
  const helpId = `${baseId}-help`
  const [open, setOpen] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!searchable || !q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, filter, searchable])

  const selected = options.find((o) => o.value === value)

  useClickOutside(rootRef, () => setOpen(false), open)

  React.useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
    if (open) {
      const idx = Math.max(
        0,
        filtered.findIndex((o) => o.value === value)
      )
      setActiveIndex(idx)
    }
  }, [open, searchable, filtered, value])

  const describedBy =
    [error ? errId : null, !error && helperText ? helpId : null].filter(Boolean).join(' ') || undefined

  const onKeyDownBtn = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    },
    [open]
  )

  const moveActive = React.useCallback(
    (delta: number) => {
      setActiveIndex((i) => {
        let n = i + delta
        n = Math.max(0, Math.min(filtered.length - 1, n))
        while (filtered[n]?.disabled && n > 0 && n < filtered.length - 1) {
          n += delta > 0 ? 1 : -1
        }
        return n
      })
    },
    [filtered]
  )

  const onKeyDownList = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveActive(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveActive(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setActiveIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setActiveIndex(Math.max(0, filtered.length - 1))
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const opt = filtered[activeIndex]
        if (opt && !opt.disabled) {
          onChange(opt.value)
          setOpen(false)
          setFilter('')
        }
      }
    },
    [activeIndex, filtered, moveActive, onChange]
  )

  return (
    <div ref={rootRef} className="relative w-full">
      {label ? (
        <label id={`${baseId}-label`} htmlFor={baseId} className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
          {label}
          {required ? <span className="text-[var(--color-destructive)]"> *</span> : null}
        </label>
      ) : null}
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <div
        id={baseId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open && filtered[activeIndex] ? `${baseId}-opt-${activeIndex}` : undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        className={cn(
          'flex h-[42px] w-full items-center justify-between rounded-[var(--radius-3)] border bg-[var(--color-input-background)] px-3 text-left text-[length:var(--text-14)] text-[var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          error ? 'border-[var(--color-destructive)]' : 'border-[var(--color-border)]',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDownBtn}
      >
        <span className={cn(!selected && 'text-[var(--color-foreground-muted)]')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-foreground-muted)]" aria-hidden />
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onKeyDownList}
          className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto rounded-[var(--radius-3)] border border-[var(--color-border)] bg-[var(--color-background-secondary)] py-1 shadow-[var(--shadow-md)]"
        >
          {searchable ? (
            <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-background-secondary)] p-2">
              <input
                ref={searchRef}
                type="search"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                    onKeyDownList(e)
                  }
                }}
                placeholder="Filter…"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input-background)] px-2 py-1.5 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                aria-label="Filter options"
              />
            </div>
          ) : null}
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--color-foreground-muted)]">No matches</div>
          ) : (
            filtered.map((opt, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={opt.value}
                  type="button"
                  id={`${baseId}-opt-${i}`}
                  role="option"
                  aria-selected={opt.value === value}
                  disabled={opt.disabled}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-ring)]',
                    isActive && 'bg-[var(--color-background-tertiary)]',
                    opt.disabled && 'cursor-not-allowed opacity-50'
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (opt.disabled) return
                    onChange(opt.value)
                    setOpen(false)
                    setFilter('')
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value ? <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden /> : null}
                </button>
              )
            })
          )}
        </div>
      ) : null}

      {error ? (
        <p id={errId} role="alert" aria-live="polite" className="mt-1 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={helpId} className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
