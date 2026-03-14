'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitInstantRFQ } from '@/lib/api'
import { Send, Loader2, Check } from 'lucide-react'

interface RfqFormProps {
  /** Pre-filled part number (e.g. from product page) */
  partNumber?: string
  /** Pre-filled quantity */
  initialQuantity?: number
  /** Compact layout for inline use */
  compact?: boolean
  /** Callback on success */
  onSuccess?: (reference: string) => void
}

export function RfqForm({ partNumber = '', initialQuantity = 1, compact = false, onSuccess }: RfqFormProps) {
  const [part_number, setPart_number] = useState(partNumber)
  const [quantity, setQuantity] = useState(String(initialQuantity))
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await submitInstantRFQ({
        part_number: part_number.trim(),
        quantity: parseInt(quantity, 10) || 1,
        email: email.trim(),
        company: company.trim() || undefined,
        message: message.trim() || undefined,
      })
      setReference(res.reference || '')
      setStatus('success')
      onSuccess?.(res.reference)
    } catch {
      setStatus('error')
      setErrorMsg('Submission failed. Please try again or email us directly.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
        <div className="flex items-center gap-3 text-primary-700">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Quote request sent</p>
            {reference && <p className="text-sm font-mono text-primary-600">Ref: {reference}</p>}
            <p className="text-sm opacity-90">We&apos;ll respond within 24 hours.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => { setStatus('idle'); setReference(''); }} className="text-sm font-medium text-primary-600 hover:underline">
            Submit another
          </button>
          <Link href="/rfq/dashboard" className="text-sm font-medium text-primary-600 hover:underline">Track RFQs</Link>
          <Link href="/rfq" className="text-sm font-medium text-primary-600 hover:underline">Full RFQ form</Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          <label htmlFor="rfq-part" className="block text-sm font-medium text-gray-700 mb-1">Part number *</label>
          <input
            id="rfq-part"
            type="text"
            required
            value={part_number}
            onChange={e => setPart_number(e.target.value)}
            placeholder="e.g. 6ES7318-3EL01-0AB0"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <div>
          <label htmlFor="rfq-qty" className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            id="rfq-qty"
            type="number"
            required
            min={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          <label htmlFor="rfq-company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            id="rfq-company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your company"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <div>
          <label htmlFor="rfq-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            id="rfq-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="rfq-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          id="rfq-message"
          rows={2}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Urgency, target price, or notes…"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
        />
      </div>
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium text-sm disabled:opacity-70 transition-colors"
      >
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {status === 'loading' ? 'Submitting…' : 'Request Quote'}
      </button>
    </form>
  )
}
