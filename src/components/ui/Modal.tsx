'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  initialFocus?: React.RefObject<HTMLElement>
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[96vw]',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  initialFocus,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const descId = React.useId()
  useFocusTrap(panelRef, open, initialFocus)

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  React.useEffect(() => {
    if (!open || !closeOnEsc) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeOnEsc, onClose])

  if (typeof document === 'undefined' || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 transition-opacity duration-200 max-sm:rounded-none opacity-100"
        style={{ background: 'var(--color-overlay)' }}
        aria-label="Close dialog"
        onClick={() => {
          if (closeOnBackdrop) onClose()
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative z-[calc(var(--z-modal)+1)] flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] shadow-[var(--shadow-lg)] transition-all duration-200 sm:translate-y-0 sm:scale-100 sm:rounded-2xl sm:opacity-100',
          sizeClass[size],
          'max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none'
        )}
      >
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--color-foreground)]">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-1 text-sm text-[var(--color-foreground-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 text-[var(--color-foreground)]">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
