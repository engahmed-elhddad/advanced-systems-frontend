'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitInstantRFQ, submitBomRfq } from '@/lib/api'
import { Plus, Trash2, Send } from 'lucide-react'

type LineItem = { part_number: string; quantity: string }

export default function InstantRFQPage() {
  const [items, setItems] = useState<LineItem[]>([{ part_number: '', quantity: '1' }])
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const p = params.get('part_number') || params.get('part')
    if (p) setItems([{ part_number: p, quantity: params.get('quantity') || '1' }])
  }, [])

  function addLine() {
    setItems((prev) => [...prev, { part_number: '', quantity: '1' }])
  }

  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter((i) => (i.part_number || '').trim().length >= 2)
    if (validItems.length === 0) {
      setErrorMsg('Add at least one part number.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Enter a valid email.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      if (validItems.length === 1) {
        const res = await submitInstantRFQ({
          part_number: validItems[0].part_number.trim(),
          quantity: parseInt(validItems[0].quantity, 10) || 1,
          email: email.trim(),
          company: company.trim() || undefined,
          message: message.trim() || undefined,
        })
        setReference(res.reference || '')
      } else {
        const res = await submitBomRfq({
          items: validItems.map((i) => ({
            part_number: i.part_number.trim(),
            quantity: parseInt(i.quantity, 10) || 1,
          })),
          email: email.trim(),
          company: company.trim() || undefined,
          message: message.trim() || undefined,
        })
        setReference(res.reference || '')
      }
      setStatus('success')
      setItems([{ part_number: '', quantity: '1' }])
      setCompany('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus('error')
      setErrorMsg('Submission failed. Please try again or email us at eng.ahmed@advancedsystems-int.com')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <span className="text-primary-600 text-sm font-semibold uppercase tracking-widest">Instant RFQ</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Request a Quote in Seconds</h1>
          <p className="text-gray-600 mt-1">Add one or more parts. We respond within 24 hours.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">
        {status === 'success' ? (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Quote Request Received</h2>
            {reference && <p className="text-sm text-gray-600 font-mono mb-4">Reference: {reference}</p>}
            <p className="text-gray-600 mb-6">We will respond within 24 hours with pricing and availability.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setStatus('idle')} className="btn-secondary">Submit Another</button>
              <Link href="/rfq/dashboard" className="btn-primary">Track RFQs</Link>
              <Link href="/rfq" className="text-gray-600 hover:text-gray-900 font-medium">Full RFQ form</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Parts *</label>
                  <button type="button" onClick={addLine} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add part
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.part_number}
                        onChange={e => updateLine(idx, 'part_number', e.target.value)}
                        placeholder="Part number"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateLine(idx, 'quantity', e.target.value)}
                        className="w-20 px-3 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeLine(idx)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                <input id="company" type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea id="message" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Urgency, target price, or notes…" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" />
              </div>
            </div>
            {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}
            <button type="submit" disabled={status === 'loading'} className="mt-6 w-full py-3.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-70 flex items-center justify-center gap-2">
              {status === 'loading' ? 'Submitting…' : <><Send className="w-5 h-5" /> Submit Request</>}
            </button>
            <p className="mt-4 text-center text-sm text-gray-500">
              <Link href="/rfq/dashboard" className="text-primary-600 hover:underline">Track your RFQs</Link> · <Link href="/rfq" className="text-primary-600 hover:underline">Full RFQ form</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
