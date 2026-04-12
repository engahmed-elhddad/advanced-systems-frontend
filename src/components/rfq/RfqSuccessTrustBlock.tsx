'use client'

import {
  Check,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Shield,
} from 'lucide-react'
import {
  RFQ_SUCCESS_FOOTER_PILLARS,
  RFQ_SUCCESS_TRUST_LINES,
  RFQ_TRUST_BRAND_NAMES,
  RFQ_URGENT_HELP_HEADLINE,
} from '@/lib/rfqExperience'
import { supportPhoneDisplay, supportPhoneTelHref } from '@/lib/constants'
import { cn } from '@/lib/utils'

const LINE_ICONS = {
  registered: Shield,
  tax: Check,
  response: Clock,
  companies: Check,
  global: Shield,
} as const

const FOOTER_ICONS = {
  secure: Shield,
  nospam: Mail,
  expert: Headphones,
} as const

type Props = {
  whatsappHref: string
  className?: string
}

export function RfqTrustFooterStrip({
  className,
  withTopBorder,
}: {
  className?: string
  withTopBorder?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-3 gap-y-2',
        withTopBorder && 'border-t border-white/[0.06] pt-4',
        className,
      )}
    >
      {RFQ_SUCCESS_FOOTER_PILLARS.map((p) => {
        const Icon = FOOTER_ICONS[p.key as keyof typeof FOOTER_ICONS] ?? Shield
        return (
          <span
            key={p.key}
            className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40"
          >
            <Icon className="h-3 w-3 text-white/35" strokeWidth={2} aria-hidden />
            {p.text}
          </span>
        )
      })}
    </div>
  )
}

export function RfqSuccessTrustBlock({ whatsappHref, className }: Props) {
  const tel = supportPhoneTelHref()
  const displayPhone = supportPhoneDisplay()

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm',
        className,
      )}
    >
      <ul className="space-y-2.5" role="list">
        {RFQ_SUCCESS_TRUST_LINES.map((line) => {
          const Icon = LINE_ICONS[line.key as keyof typeof LINE_ICONS] ?? Check
          return (
            <li key={line.key} className="flex items-start gap-2.5 text-left">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-200/90">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </span>
              <span className="pt-0.5 text-[13px] leading-snug text-white/70">{line.text}</span>
            </li>
          )
        })}
      </ul>

      <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Brands we supply</p>
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 sm:justify-start">
        {RFQ_TRUST_BRAND_NAMES.map((name) => (
          <span
            key={name}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30"
          >
            {name}
          </span>
        ))}
      </div>

      <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />

      <p className="text-center text-xs font-medium text-white/75">{RFQ_URGENT_HELP_HEADLINE}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/28 bg-emerald-500/[0.1] py-2.5 text-xs font-semibold text-emerald-100/95 transition-colors hover:bg-emerald-500/[0.16]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          WhatsApp
        </a>
        {tel ? (
          <a
            href={tel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] py-2.5 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.09]"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {displayPhone || 'Call us'}
          </a>
        ) : null}
      </div>

      <RfqTrustFooterStrip className="mt-4" withTopBorder />
    </div>
  )
}
