'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Loader2, Check, Copy, ClipboardList } from 'lucide-react'
import { useRFQSubmit } from '@/features/rfq/hooks/useRFQSubmit'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  RFQ_EMAIL_CONFIRMATION_LINE,
  RFQ_EXPECTED_RESPONSE_HEADLINE,
  RFQ_NEXT_STEPS,
} from '@/lib/rfqExperience'
import { whatsappHref } from '@/lib/constants'
import { RfqSuccessTrustBlock } from '@/components/rfq/RfqSuccessTrustBlock'
import toast from 'react-hot-toast'

interface RfqFormProps {
  partNumber?: string
  initialQuantity?: number
  compact?: boolean
  onSuccess?: (reference: string) => void
}

const shell = 'rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6'

export function RfqForm({ partNumber = '', initialQuantity = 1, compact = false, onSuccess }: RfqFormProps) {
  const [part_number, setPart_number] = useState(partNumber)
  const [quantity, setQuantity] = useState(String(initialQuantity))
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const { submit, isLoading, isSuccess, data, error, reset } = useRFQSubmit({
    successToast: false,
    errorToast: false,
    analyticsSource: 'embedded_rfq_form',
  })

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
    const ref = data.reference
    const waLink = whatsappHref(part_number.trim() || 'quote request')
    return (
      <div className={cn(shell, 'space-y-5 animate-fade-in-up')}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-[0_0_32px_rgba(16,185,129,0.18)]">
            <Check className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200/85">Submitted</p>
            <p className="mt-1 text-lg font-semibold text-white">We received your request</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-orange-100/90">{RFQ_EXPECTED_RESPONSE_HEADLINE}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{RFQ_EMAIL_CONFIRMATION_LINE}</p>
          </div>
        </div>

        <RfqSuccessTrustBlock whatsappHref={waLink} />

        {ref ? (
          <div className="rounded-xl border border-orange-400/25 bg-gradient-to-b from-orange-500/[0.1] to-black/30 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-200/90">Your reference — save this</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight text-orange-50">{ref}</span>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(ref).then(() => toast.success('Copied'))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.07] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-200/90">What happens next</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-white/65">
            {RFQ_NEXT_STEPS.map((s) => (
              <li key={s} className="leading-snug">
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" className="flex-1" asChild>
            <Link href={ref ? `/account/rfqs/${encodeURIComponent(ref)}` : '/account/rfqs'}>
              <ClipboardList className="mr-2 h-4 w-4" aria-hidden />
              Track request
            </Link>
          </Button>
          <Button variant="secondary" type="button" className="flex-1" onClick={handleReset}>
            Another part
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn(shell, compact ? 'space-y-3' : 'space-y-4')}>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid gap-4 sm:grid-cols-2'}>
        <Input
          label="Part number"
          id="rfq-part"
          required
          value={part_number}
          onChange={(e) => setPart_number(e.target.value)}
          readOnly={Boolean(partNumber)}
          className={partNumber ? 'font-mono' : ''}
        />
        <Input
          label="Quantity"
          id="rfq-qty"
          type="number"
          required
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid gap-4 sm:grid-cols-2'}>
        <Input
          label="Work email"
          id="rfq-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Input label="Company" id="rfq-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
      </div>
      {error != null ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100/95">
          Something went wrong. Please try again or use the main quote modal from any product page.
        </div>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" disabled={isLoading} loading={isLoading}>
        {isLoading ? null : <Zap className="mr-2 h-4 w-4" aria-hidden />}
        Request quote
      </Button>
      <p className="text-center text-[11px] text-white/40">No payment online · Typical first response 2–6 business hours</p>
    </form>
  )
}
