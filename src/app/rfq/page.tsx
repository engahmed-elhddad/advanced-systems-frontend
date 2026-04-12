'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { FloatingInput, FloatingTextarea } from '@/components/rfq/FloatingField'
import { useRFQSubmit } from '@/features/rfq/hooks/useRFQSubmit'
import { WHATSAPP_NUMBER } from '@/lib/constants'
import { RFQ_EMAIL_CONFIRMATION_LINE, RFQ_EXPECTED_RESPONSE_HEADLINE } from '@/lib/rfqExperience'
import { RfqSuccessTrustBlock } from '@/components/rfq/RfqSuccessTrustBlock'
import { RfqPageTrustSection } from '@/components/rfq/RfqPageTrustSection'
import { trackRfqCtaClick, trackWhatsApp } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { formatVariantConditionLabel, mergeVariantIntoMessage } from '@/lib/productVariants'

const schema = z.object({
  part_number: z.string().min(1, 'Part number or product name is required'),
  quantity: z.coerce.number().min(1, 'Minimum quantity is 1'),
  contact_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  company: z.string().optional(),
  country: z.string().optional(),
  message: z.string().optional(),
})

type FormState = {
  part_number: string
  quantity: string
  contact_name: string
  email: string
  phone: string
  company: string
  country: string
  message: string
}

const emptyForm: FormState = {
  part_number: '',
  quantity: '1',
  contact_name: '',
  email: '',
  phone: '',
  company: '',
  country: '',
  message: '',
}

const COUNTRIES = [
  'Egypt',
  'Saudi Arabia',
  'UAE',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Jordan',
  'Other',
] as const

const glass =
  'rounded-xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl'

export default function RFQPage() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [linkedProductId, setLinkedProductId] = useState<number | undefined>()
  const { submitAsync, isLoading, reset } = useRFQSubmit({ analyticsSource: 'rfq_page' })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('product_id')
    if (pid && /^\d+$/.test(pid)) setLinkedProductId(Number(pid))
    const part = params.get('part_number') || params.get('part')
    const name = params.get('product_name') || params.get('name')
    const q = params.get('quantity')
    const vCond = params.get('variant_condition')
    const vId = params.get('variant_id')
    const savedEmail = localStorage.getItem('rfq_email')
    const savedCompany = localStorage.getItem('rfq_company')

    setForm((f) => {
      let next = { ...f }
      if (part || name) {
        next = {
          ...next,
          part_number: part || name || next.part_number,
          ...(q && !Number.isNaN(Number(q)) ? { quantity: String(Math.max(1, Number(q))) } : {}),
        }
      }
      const pnForBlock = (part || name || next.part_number || '').trim()
      if (pnForBlock && (vCond || vId)) {
        const blockLines = [
          `Part: ${pnForBlock}`,
          vCond ? `Condition: ${formatVariantConditionLabel(vCond)}` : null,
          vId && /^\d+$/.test(vId) ? `Variant ID: ${vId}` : null,
        ].filter(Boolean) as string[]
        if (blockLines.length) {
          const block = `---\n${blockLines.join('\n')}`
          next = { ...next, message: mergeVariantIntoMessage(next.message || '', block) }
        }
      }
      if (savedEmail || savedCompany) {
        next = {
          ...next,
          ...(savedEmail ? { email: savedEmail } : {}),
          ...(savedCompany ? { company: savedCompany } : {}),
        }
      }
      return next
    })
  }, [])

  const errors = useMemo(() => {
    const r = schema.safeParse({ ...form, quantity: form.quantity })
    if (r.success) return {} as Record<string, string>
    const out: Record<string, string> = {}
    for (const issue of r.error.issues) {
      const k = issue.path[0]
      if (typeof k === 'string' && !out[k]) out[k] = issue.message
    }
    return out
  }, [form])

  const showErr = (field: keyof FormState) => Boolean((touched[field] || submitted) && errors[field])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const parsed = schema.safeParse({ ...form, quantity: form.quantity })
    if (!parsed.success) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('rfq_email', parsed.data.email)
      if (parsed.data.company?.trim()) localStorage.setItem('rfq_company', parsed.data.company.trim())
    }
    try {
      const pn = parsed.data.part_number.trim()
      trackRfqCtaClick({
        source: 'rfq_page_submit_click',
        part_number: pn,
        product_id: linkedProductId ?? null,
      })
      await submitAsync({
        part_number: pn,
        quantity: parsed.data.quantity,
        email: parsed.data.email.trim(),
        contact_name: parsed.data.contact_name.trim(),
        phone: parsed.data.phone.trim(),
        company: parsed.data.company?.trim() || undefined,
        country: parsed.data.country?.trim() || undefined,
        message: parsed.data.message?.trim() || undefined,
        product_id: linkedProductId,
      })
      setCompleted(true)
      setForm(emptyForm)
      setSubmitted(false)
    } catch {
      /* handled */
    }
  }

  const waPrefill = encodeURIComponent(
    `Hello Advanced Systems, I submitted an RFQ from the website. Please follow up on my quote.`
  )
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waPrefill}`

  if (completed) {
    return (
      <div className="relative z-10 min-h-screen px-4 pb-24 pt-10 sm:pt-16">
        <div className="mx-auto max-w-lg">
          <div className={cn(glass, 'p-8 sm:p-10')}>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
                <Check className="h-8 w-8" strokeWidth={2.5} />
              </div>
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Your request has been received</h1>
            </div>
            <p className="mt-4 text-sm font-medium leading-relaxed text-orange-100/90">{RFQ_EXPECTED_RESPONSE_HEADLINE}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{RFQ_EMAIL_CONFIRMATION_LINE}</p>
            <RfqSuccessTrustBlock whatsappHref={waHref} className="mt-6" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  reset()
                  setCompleted(false)
                }}
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Submit another RFQ
              </button>
              <Link
                href="/products"
                className="rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-orange-500/35 transition-all hover:brightness-110"
              >
                Browse products
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen px-4 pb-24 pt-8 sm:pt-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300/90">Request for quote</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Get a fast, firm quote</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
            One short form — our team returns pricing and lead time fast. No spam, no obligation.
          </p>
        </div>

        <RfqPageTrustSection className="mb-6" />

        <form onSubmit={handleSubmit} className={cn(glass, 'space-y-5 p-6 sm:p-8')} noValidate>
          <FloatingInput
            id="part_number"
            name="part_number"
            label="Part number / product name *"
            autoComplete="off"
            value={form.part_number}
            onChange={(e) => setForm((f) => ({ ...f, part_number: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, part_number: true }))}
            error={showErr('part_number') ? errors.part_number : undefined}
            inputClassName="h-14"
          />

          <FloatingInput
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            label="Quantity *"
            autoComplete="off"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, quantity: true }))}
            error={showErr('quantity') ? errors.quantity : undefined}
            inputClassName="h-14"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FloatingInput
              id="contact_name"
              name="contact_name"
              label="Your name *"
              autoComplete="name"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, contact_name: true }))}
              error={showErr('contact_name') ? errors.contact_name : undefined}
              inputClassName="h-14"
            />
            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Work email *"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={showErr('email') ? errors.email : undefined}
              inputClassName="h-14"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FloatingInput
              id="phone"
              name="phone"
              type="tel"
              label="Phone *"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              error={showErr('phone') ? errors.phone : undefined}
              inputClassName="h-14"
            />
            <div className="relative">
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, country: true }))}
                className="h-14 w-full appearance-none rounded-xl border border-white/15 bg-white/[0.07] px-4 pb-2 pt-5 text-[15px] text-white outline-none transition-all focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/20"
              >
                <option value="">Country (optional)</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0f172a] text-white">
                    {c}
                  </option>
                ))}
              </select>
              <label htmlFor="country" className="pointer-events-none absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Region
              </label>
            </div>
          </div>

          <FloatingInput
            id="company"
            name="company"
            label="Company (optional)"
            autoComplete="organization"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, company: true }))}
            inputClassName="h-14"
          />

          <FloatingTextarea
            id="message"
            name="message"
            label="Message (target price, urgency, condition…)"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            inputClassName="min-h-[132px]"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'relative w-full overflow-hidden rounded-xl py-4 text-base font-bold text-white transition-all duration-300',
              'bg-gradient-to-r from-[#FF7A00] via-[#FF6A00] to-[#FF5500]',
              'shadow-[0_0_40px_rgba(255,106,0,0.45),0_12px_40px_rgba(0,0,0,0.35)]',
              'hover:brightness-110 hover:shadow-[0_0_52px_rgba(255,122,0,0.55)]',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {isLoading ? 'Submitting…' : 'Submit RFQ'}
          </button>

          <p className="text-center text-xs text-white/40">
            Prefer instant help?{' '}
            <a
              href={waHref}
              className="font-medium text-orange-300 hover:text-orange-200"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackWhatsApp({ source: 'rfq_page_whatsapp', part_number: form.part_number.trim() || undefined })}
            >
              WhatsApp us
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
