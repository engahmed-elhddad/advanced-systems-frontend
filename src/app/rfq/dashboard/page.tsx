'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getMyRfqs } from '@/lib/api'
import { Search, Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function RfqDashboardPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [data, setData] = useState<{
    requests: Array<{
      reference: string
      status: string
      email: string
      company: string | null
      created_at: string | null
      items: Array<{ part_number: string; quantity: number }>
    }>
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const e2 = email.trim()
    if (!e2 || !e2.includes('@')) {
      setErrorMsg('Enter a valid email address.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await getMyRfqs(e2)
      setData(res)
      setStatus('loaded')
    } catch {
      setStatus('error')
      setErrorMsg('Could not load RFQs. Please try again.')
    }
  }

  const StatusBadge = ({ s }: { s: string }) => {
    const lower = (s || 'pending').toLowerCase()
    const isDone = lower === 'quoted' || lower === 'closed'
    const isRej = lower === 'cancelled' || lower === 'rejected'
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isDone ? 'bg-green-100 text-green-800' : isRej ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
      }`}>
        {isDone ? <CheckCircle className="w-3 h-3" /> : isRej ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {s || 'Pending'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-primary-600 text-sm font-semibold uppercase tracking-widest">RFQ Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Track Your Quote Requests</h1>
          <p className="text-gray-600 mt-1">Enter your email to view all your RFQ submissions.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleLookup} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-70 flex items-center gap-2"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Look up
          </button>
        </form>

        {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 mb-6">{errorMsg}</div>}

        {status === 'loaded' && data && (
          <div className="space-y-4">
            {data.requests && data.requests.length > 0 ? (
              data.requests.map((r) => (
                <div key={r.reference} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className="font-mono font-semibold text-gray-900">{r.reference}</span>
                    <StatusBadge s={r.status} />
                  </div>
                  {r.company && <p className="text-sm text-gray-600 mb-2">Company: {r.company}</p>}
                  {r.created_at && (
                    <p className="text-xs text-gray-500 mb-3">
                      Submitted {new Date(r.created_at).toLocaleDateString()} at {new Date(r.created_at).toLocaleTimeString()}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Parts requested:</p>
                    <ul className="space-y-1">
                      {r.items.map((it, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-mono">{it.part_number}</span>
                          <span className="text-gray-400">× {it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No RFQs found for this email.</p>
                <Link href="/rfq/instant" className="mt-4 inline-block text-primary-600 font-medium hover:underline">Submit a quote request</Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/rfq/instant" className="text-primary-600 font-medium hover:underline">Instant RFQ</Link>
          <Link href="/rfq" className="text-primary-600 font-medium hover:underline">Full RFQ form</Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
