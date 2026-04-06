'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Loader2, Check } from 'lucide-react'
import { useRFQSubmit } from '@/hooks/useRFQSubmit'

interface RfqFormProps {
  partNumber?: string
  initialQuantity?: number
  compact?: boolean
  onSuccess?: (reference: string) => void
}

export function RfqForm({ partNumber = '', initialQuantity = 1, compact = false, onSuccess }: RfqFormProps) {
  const [part_number, setPart_number] = useState(partNumber)
  const [quantity, setQuantity] = useState(String(initialQuantity))
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const { submit, isLoading, isSuccess, data, error, reset } = useRFQSubmit()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rfq_email')
      const savedCompany = localStorage.getItem('rfq_company')
      if (savedEmail) setEmail(savedEmail)
      if (savedCompany) setCompany(savedCompany)
    }
  }, [])

  useEffect(() => {
    if (isSuccess && data?.reference) {
      onSuccess?.(data.reference)
    }
  }, [isSuccess, data, onSuccess])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (typeof window !== 'undefined') {
        localStorage.setItem('rfq_email', email.trim())
        if (company.trim()) localStorage.setItem('rfq_company', company.trim())
      }
      submit({
        part_number: part_number.trim(),
        quantity: parseInt(quantity, 10) || 1,
        email: email.trim(),
        company: company.trim(),
      })
    },
    [part_number, quantity, email, company, submit],
  )

  const handleReset = useCallback(() => {
    reset()
    setPart_number('')
    setQuantity('1')
  }, [reset])

  if (isSuccess && data) {
    return (
      <div className="rounded-[2px] border border-[#0072CE]/20 bg-[#E8F4FD] p-5">
        <div className="flex items-center gap-3 text-[#0072CE]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[#0072CE]/10">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-[#1A1A1A]">Price request submitted</p>
            {data.reference && <p className="text-sm font-mono text-[#0072CE]">Ref: {data.reference}</p>}
            <p className="text-sm text-[#6B7280]">We&apos;ll respond within 2–4 hours.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handleReset} className="text-sm font-medium text-[#0072CE] hover:underline">
            Request another
          </button>
          <Link href="/rfq/dashboard" className="text-sm font-medium text-[#0072CE] hover:underline">Track RFQs</Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          <label htmlFor="rfq-part" className="block text-sm font-medium text-[#1A1A1A] mb-1">Part number *</label>
          <input
            id="rfq-part"
            type="text"
            required
            value={part_number}
            onChange={e => setPart_number(e.target.value)}
            readOnly={Boolean(partNumber)}
            className={`w-full px-3 py-2 rounded-[2px] border border-[#E5E7EB] focus:ring-1 focus:ring-[#0072CE]/20 focus:border-[#0072CE] focus:outline-none text-sm ${partNumber ? 'bg-[#F9FAFB] font-mono' : ''}`}
          />
        </div>
        <div>
          <label htmlFor="rfq-qty" className="block text-sm font-medium text-[#1A1A1A] mb-1">Quantity *</label>
          <input
            id="rfq-qty"
            type="number"
            required
            min={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full px-3 py-2 rounded-[2px] border border-[#E5E7EB] focus:ring-1 focus:ring-[#0072CE]/20 focus:border-[#0072CE] focus:outline-none text-sm"
          />
        </div>
      </div>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          <label htmlFor="rfq-email" className="block text-sm font-medium text-[#1A1A1A] mb-1">Email *</label>
          <input
            id="rfq-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 rounded-[2px] border border-[#E5E7EB] focus:ring-1 focus:ring-[#0072CE]/20 focus:border-[#0072CE] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label htmlFor="rfq-company" className="block text-sm font-medium text-[#1A1A1A] mb-1">Company <span className="text-[#9CA3AF]">(optional)</span></label>
          <input
            id="rfq-company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your company"
            className="w-full px-3 py-2 rounded-[2px] border border-[#E5E7EB] focus:ring-1 focus:ring-[#0072CE]/20 focus:border-[#0072CE] focus:outline-none text-sm"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-[#EF4444] bg-[#FEF2F2] border border-[#EF4444]/20 rounded-[2px] px-3 py-2">
          Submission failed. Please try again or email us directly.
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm disabled:opacity-70 transition-colors duration-150"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {isLoading ? 'Submitting...' : 'Get Price in 2 Hours'}
      </button>
      <p className="text-[10px] text-[#6B7280] text-center">
        Typical response: 2–4 hours &middot; No commitment required
      </p>
    </form>
  )
}
