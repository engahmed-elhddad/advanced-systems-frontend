'use client'

/**
 * Spec 031 T022 — manual cron trigger buttons.
 *
 * Two buttons that fire the corresponding backend cron endpoint through the
 * server-side proxy at /api/payments/trigger. The browser only ever sees its
 * own admin Bearer token; CRON_SECRET stays on the Vercel server (AC-08).
 */

import { useState } from 'react'

interface ToastState {
  tone: 'success' | 'error'
  message: string
}

interface ExpireResult {
  expired_count?: number
  attempt_ids?: number[]
}

interface ReconcileResult {
  checked?: number
  drift_detected?: number
  drift_ids?: number[]
}

async function callTrigger(action: 'expire' | 'reconcile'): Promise<ExpireResult | ReconcileResult> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('admin_token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch('/api/payments/trigger', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action }),
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = { error: 'invalid_json_response', body: text.slice(0, 200) }
  }
  if (!res.ok) {
    const detail =
      typeof parsed === 'object' && parsed !== null && 'error' in (parsed as Record<string, unknown>)
        ? String((parsed as Record<string, unknown>).error)
        : `HTTP ${res.status}`
    throw new Error(detail)
  }
  return parsed as ExpireResult | ReconcileResult
}

export function CronTriggerButtons() {
  const [busy, setBusy] = useState<'expire' | 'reconcile' | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const run = async (action: 'expire' | 'reconcile') => {
    setBusy(action)
    setToast(null)
    try {
      const result = await callTrigger(action)
      if (action === 'expire') {
        const r = result as ExpireResult
        setToast({
          tone: 'success',
          message: `Expired ${r.expired_count ?? 0} stale attempt(s)${
            (r.attempt_ids?.length ?? 0) > 0 ? ` — ids: ${r.attempt_ids!.join(', ')}` : ''
          }`,
        })
      } else {
        const r = result as ReconcileResult
        setToast({
          tone: 'success',
          message: `Reconciled ${r.checked ?? 0} attempt(s) — drift detected: ${r.drift_detected ?? 0}${
            (r.drift_ids?.length ?? 0) > 0 ? ` (ids: ${r.drift_ids!.join(', ')})` : ''
          }`,
        })
      }
    } catch (error) {
      setToast({
        tone: 'error',
        message: `${action === 'expire' ? 'Run Expire' : 'Run Reconcile'} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="cron-title" className="space-y-3">
      <header>
        <h2 id="cron-title" className="text-sm font-semibold uppercase tracking-wide text-[--text-secondary]">
          Manual cron triggers
        </h2>
        <p className="text-xs text-[--text-secondary]">
          These run the same backend endpoints Vercel fires on schedule. Use to validate
          deploys or to flush a stuck queue on demand.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="cron-trigger-expire"
          onClick={() => run('expire')}
          disabled={busy !== null}
          className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 transition-opacity hover:bg-amber-500/15 disabled:opacity-50"
        >
          {busy === 'expire' ? 'Running…' : 'Run Expire'}
        </button>
        <button
          type="button"
          data-testid="cron-trigger-reconcile"
          onClick={() => run('reconcile')}
          disabled={busy !== null}
          className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition-opacity hover:bg-sky-500/15 disabled:opacity-50"
        >
          {busy === 'reconcile' ? 'Running…' : 'Run Reconcile'}
        </button>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="cron-trigger-toast"
          className={`rounded-lg border p-3 text-sm ${
            toast.tone === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
              : 'border-red-400/30 bg-red-500/10 text-red-100'
          }`}
        >
          {toast.message}
        </div>
      )}
    </section>
  )
}
