'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_BASE_URL } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

type BulkRFQResponse = {
  matched?: Array<{ part_number?: string; [k: string]: unknown }>
  unmatched?: Array<{ part_number?: string; [k: string]: unknown }> | string[]
  [k: string]: unknown
}

function parseMpns(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function QuickRFQWidget() {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkRFQResponse | null>(null)

  const mpns = useMemo(() => parseMpns(raw), [raw])

  const matched = result?.matched ?? []
  const unmatchedRaw = result?.unmatched ?? []
  const unmatched = Array.isArray(unmatchedRaw)
    ? unmatchedRaw.map((u) => (typeof u === 'string' ? u : String((u as { part_number?: string }).part_number ?? '')))
    : []

  async function submit() {
    if (!mpns.length || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/v1/rfq/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpns }),
      })
      const json = (await res.json().catch(() => ({}))) as BulkRFQResponse & { detail?: string }
      if (!res.ok) {
        setResult(null)
        setError(json?.detail || 'Failed to submit RFQ bulk request')
      } else {
        setResult(json)
      }
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Failed to submit RFQ bulk request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full py-10" style={{ backgroundColor: 'var(--bg-header)' }}>
      <div className="page-container">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl md:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Quick RFQ</h2>
            <p className="mt-1 text-sm text-white/65">
              Paste MPNs (one per line or comma-separated) to request a bulk quote.
            </p>
          </div>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="6SL3210-1KE11-8AF1, ATV71HD15N4&#10;XS630B1MAL2"
            className="min-h-[120px] w-full rounded-xl border border-white/15 bg-[#0a1629]/80 p-3 text-sm text-white outline-none transition focus:border-orange-400/50"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-white/50">{mpns.length} MPN{mpns.length === 1 ? '' : 's'} parsed</p>
            <Button type="button" variant="primary" onClick={() => void submit()} disabled={!mpns.length || loading}>
              {loading ? 'Submitting…' : 'Submit bulk RFQ'}
            </Button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {result ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                <p className="text-sm font-semibold text-emerald-200">Matched ({matched.length})</p>
                <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-xs text-emerald-100/90">
                  {matched.length ? (
                    matched.map((m, i) => <li key={`${String(m.part_number ?? i)}-${i}`}>{String(m.part_number ?? '—')}</li>)
                  ) : (
                    <li>None</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                <p className="text-sm font-semibold text-amber-200">Unmatched ({unmatched.length})</p>
                <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-xs text-amber-100/90">
                  {unmatched.length ? unmatched.map((u, i) => <li key={`${u}-${i}`}>{u || '—'}</li>) : <li>None</li>}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

