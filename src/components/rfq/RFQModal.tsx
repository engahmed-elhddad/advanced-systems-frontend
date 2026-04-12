'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { X, Check, Copy, ClipboardList, ListOrdered } from 'lucide-react'
import { FloatingInput, FloatingTextarea } from '@/components/rfq/FloatingField'
import { submitRFQ } from '@/lib/api'
import { submitBatchRFQ } from '@/features/rfq/services/rfqService'
import { WHATSAPP_NUMBER } from '@/lib/constants'
import { RfqSuccessTrustBlock } from '@/components/rfq/RfqSuccessTrustBlock'
import { trackRfqSubmit } from '@/lib/analytics'
import { useRFQListStore } from '@/state/rfqListStore'
import { useUIStore } from '@/state/uiStore'
import { cn } from '@/lib/utils'
import {
  RFQ_EMAIL_CONFIRMATION_LINE,
  RFQ_EXPECTED_RESPONSE_HEADLINE,
  RFQ_NEXT_STEPS,
} from '@/lib/rfqExperience'
import toast from 'react-hot-toast'
import Link from 'next/link'

const schema = z.object({
  contact_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(6, 'Enter a valid phone'),
  company: z.string().optional(),
  country: z.string().optional(),
  message: z.string().optional(),
  quantity: z.coerce.number().min(1).optional(),
})

interface RFQModalProps {
  product: { part_number?: string; name?: string; id?: number }
  onClose: () => void
}

const glassModal =
  'relative max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#0c1528]/90 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8 touch-manipulation'

export function RFQModal({ product, onClose }: RFQModalProps) {
  const listMode = useUIStore((s) => s.rfqListMode)
  const listItems = useRFQListStore((s) => s.items)
  const clearList = useRFQListStore((s) => s.clear)

  const [quantity, setQuantity] = useState('1')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedReferences, setSubmittedReferences] = useState<string[]>([])

  const partLabel = listMode
    ? listItems.map((i) => `${i.part_number} ×${i.quantity}`).join(', ') || 'Your RFQ list'
    : product?.part_number || product?.name || 'Product'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedEmail = localStorage.getItem('rfq_email')
    const savedCompany = localStorage.getItem('rfq_company')
    if (savedEmail) setEmail(savedEmail)
    if (savedCompany) setCompany(savedCompany)
  }, [])

  const errors = useMemo(() => {
    const base = {
      contact_name: contactName,
      email,
      phone,
      company: company || undefined,
      country: country || undefined,
      message: message || undefined,
      quantity: listMode ? undefined : Number(quantity) || 1,
    }
    const r = schema.safeParse(base)
    if (r.success) return {} as Record<string, string>
    const out: Record<string, string> = {}
    for (const issue of r.error.issues) {
      const k = issue.path[0]
      if (typeof k === 'string' && !out[k]) out[k] = issue.message
    }
    return out
  }, [contactName, email, phone, company, country, message, quantity, listMode])

  const show = (field: string) => Boolean((touched[field] || submitted) && errors[field])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const base = {
      contact_name: contactName,
      email,
      phone,
      company: company || undefined,
      country: country || undefined,
      message: message || undefined,
      quantity: listMode ? 1 : Number(quantity) || 1,
    }
    const parsed = schema.safeParse(base)
    if (!parsed.success) return

    setSubmitting(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rfq_email', parsed.data.email.trim())
        if (company.trim()) localStorage.setItem('rfq_company', company.trim())
      }

      if (listMode) {
        if (listItems.length === 0) {
          toast.error('Add parts to your list first')
          setSubmitting(false)
          return
        }
        const batchItems = listItems.map((i) => ({ part_number: i.part_number, quantity: i.quantity }))
        const batchPartNumbers = batchItems.map((i) => i.part_number)
        const batch = await submitBatchRFQ({
          email: parsed.data.email.trim(),
          company: parsed.data.company,
          contact_name: parsed.data.contact_name.trim(),
          country: parsed.data.country,
          phone: parsed.data.phone.trim(),
          message: parsed.data.message,
          items: batchItems,
        })
        setSubmittedReferences(batch.references ?? [])
        clearList()
        trackRfqSubmit({
          source: 'modal_batch',
          part_numbers: batchPartNumbers,
          references: batch.references,
        })
      } else {
        const created = await submitRFQ({
          part_number: String(product?.part_number || product?.name || '').trim(),
          quantity: parsed.data.quantity ?? 1,
          email: parsed.data.email.trim(),
          contact_name: parsed.data.contact_name.trim(),
          phone: parsed.data.phone.trim(),
          company: parsed.data.company?.trim(),
          country: parsed.data.country?.trim(),
          message: parsed.data.message?.trim(),
          product_id: typeof product?.id === 'number' ? product.id : undefined,
        })
        setSubmittedReferences(created.reference ? [created.reference] : [])
        trackRfqSubmit({
          source: 'modal',
          part_number: created.part_number,
          reference: created.reference,
          quantity: parsed.data.quantity ?? 1,
          product_id: typeof product?.id === 'number' ? product.id : undefined,
        })
      }
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit RFQ'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello Advanced Systems — RFQ for ${partLabel}`
  )}`

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center sm:p-6">
      <div className={cn(glassModal, 'transition-opacity duration-200')}>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/90">Request quote</p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-white sm:text-xl">
              {listMode ? 'Quote for selected parts' : `Quote — ${partLabel}`}
            </h2>
            {listMode && listItems.length > 0 ? (
              <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-xs text-white/55">
                {listItems.map((i) => (
                  <li key={i.part_number} className="font-mono">
                    {i.part_number} <span className="text-white/35">×{i.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-5 animate-fade-in-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <Check className="h-7 w-7" strokeWidth={2.25} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200/80">Quote request submitted</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-white">You&apos;re all set — we&apos;re on it</p>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-orange-100/90">
                {RFQ_EXPECTED_RESPONSE_HEADLINE}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">{RFQ_EMAIL_CONFIRMATION_LINE}</p>
            </div>

            <RfqSuccessTrustBlock whatsappHref={waHref} />

            {submittedReferences.length > 0 ? (
              <div className="rounded-xl border border-orange-400/25 bg-gradient-to-b from-orange-500/[0.12] to-white/[0.03] p-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-200/90">
                  {submittedReferences.length > 1 ? 'Save your references' : 'Your reference — save this'}
                </p>
                <ul className="mt-2 space-y-2">
                  {submittedReferences.map((ref) => (
                    <li
                      key={ref}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.12] bg-black/35 px-3 py-2.5"
                    >
                      <span className="font-mono text-base font-bold tracking-tight text-orange-50">{ref}</span>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/10"
                        onClick={() => {
                          void navigator.clipboard.writeText(ref).then(() => toast.success('Reference copied'))
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Copy
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-xl border border-white/[0.08] bg-violet-500/[0.06] p-4 text-left">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-200/90">
                <ListOrdered className="h-4 w-4" aria-hidden />
                What happens next
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-white/65">
                {RFQ_NEXT_STEPS.map((step) => (
                  <li key={step} className="leading-snug">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={
                  submittedReferences.length === 1
                    ? `/account/rfqs/${encodeURIComponent(submittedReferences[0])}`
                    : '/account/rfqs'
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-400/35 bg-orange-500/15 py-3.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(255,122,0,0.15)] transition-all hover:bg-orange-500/25"
                onClick={() => onClose()}
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                {submittedReferences.length === 1 ? 'Track this request' : 'Track your requests'}
              </Link>
              <p className="text-center text-[11px] text-white/45">
                Track anytime with the email you used — your requests stay in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!listMode ? (
              <FloatingInput
                id="modal-qty"
                name="quantity"
                type="number"
                min={1}
                label="Quantity *"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, quantity: true }))}
                error={show('quantity') ? errors.quantity : undefined}
                inputClassName="h-12"
              />
            ) : null}

            <FloatingInput
              id="modal-name"
              name="contact_name"
              label="Your name *"
              autoComplete="name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, contact_name: true }))}
              error={show('contact_name') ? errors.contact_name : undefined}
              inputClassName="h-12"
            />
            <FloatingInput
              id="modal-email"
              name="email"
              type="email"
              label="Work email *"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={show('email') ? errors.email : undefined}
              inputClassName="h-12"
            />
            <FloatingInput
              id="modal-phone"
              name="phone"
              type="tel"
              label="Phone *"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              error={show('phone') ? errors.phone : undefined}
              inputClassName="h-12"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                id="modal-company"
                name="company"
                label="Company (optional)"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                inputClassName="h-12"
              />
              <div className="relative">
                <select
                  id="modal-country"
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 pb-1 pt-5 text-sm text-white outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/20"
                >
                  <option value="" className="bg-[#0f172a]">
                    Country (optional)
                  </option>
                  {['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Other'].map((c) => (
                    <option key={c} value={c} className="bg-[#0f172a]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <FloatingTextarea
              id="modal-msg"
              name="message"
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputClassName="min-h-[88px]"
            />

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all',
                'bg-gradient-to-r from-[#FF7A00] to-[#FF5500]',
                'shadow-[0_0_36px_rgba(255,106,0,0.45)] hover:brightness-110 disabled:opacity-50'
              )}
            >
              {submitting ? 'Submitting…' : 'Submit RFQ'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
