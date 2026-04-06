import { TOAST_DEFAULT_MS, TOAST_MAX_VISIBLE } from '@/lib/constants'
import { useUIStore, type UIToast } from '@/state/useUIStore'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem extends UIToast {
  kind: ToastKind
}

let seq = 0

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function push(
  kind: ToastKind,
  message: string,
  opts?: { duration?: number; action?: { label: string; onClick: () => void } }
) {
  const id = String(++seq)
  const duration = opts?.duration ?? TOAST_DEFAULT_MS
  const entry: ToastItem = { id, kind, message, duration, action: opts?.action }
  useUIStore.getState().addToast(entry)
  const toasts = useUIStore.getState().toasts
  if (toasts.length > TOAST_MAX_VISIBLE) {
    useUIStore.getState().removeToast(toasts[0]?.id ?? '')
  }
  timers.set(
    id,
    setTimeout(() => {
      dismiss(id)
    }, duration)
  )
}

export function dismiss(id: string) {
  const t = timers.get(id)
  if (t) clearTimeout(t)
  timers.delete(id)
  useUIStore.getState().removeToast(id)
}

export const toast = {
  success: (
    message: string,
    opts?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => push('success', message, opts),
  error: (
    message: string,
    opts?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => push('error', message, opts),
  warning: (
    message: string,
    opts?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => push('warning', message, opts),
  info: (
    message: string,
    opts?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => push('info', message, opts),
}
