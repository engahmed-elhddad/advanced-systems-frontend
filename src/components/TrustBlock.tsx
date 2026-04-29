import Link from 'next/link'
import { MessageCircle, Mail, Phone, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import {
  COMPANY_TRUST_STATEMENTS,
  CONTACT_LABEL_EMAIL_AR,
  CONTACT_LABEL_EMAIL_EN,
  CONTACT_LABEL_PHONE_AR,
  CONTACT_LABEL_PHONE_EN,
  CONTACT_LABEL_WHATSAPP_AR,
  CONTACT_LABEL_WHATSAPP_EN,
  ISO_CERTIFICATIONS,
  ISO_LABEL_AR,
  ISO_LABEL_EN,
  RMA_BADGE_AR,
  RMA_BADGE_EN,
  WARRANTY_BADGE_AR,
  WARRANTY_BADGE_EN,
  WHATSAPP_INQUIRY_TEMPLATE_AR,
  WHATSAPP_INQUIRY_TEMPLATE_EN,
} from '@/lib/company'
import { CONTACT_EMAIL, WHATSAPP_NUMBER, supportPhoneTelHref } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface TrustBlockProps {
  partNumber: string
  locale?: 'en' | 'ar'
  className?: string
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function buildWhatsAppHref(partNumber: string, locale: 'en' | 'ar'): string {
  const template = locale === 'ar' ? WHATSAPP_INQUIRY_TEMPLATE_AR : WHATSAPP_INQUIRY_TEMPLATE_EN
  const text = template.replace('{part_number}', partNumber)
  const digits = onlyDigits(WHATSAPP_NUMBER)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export default function TrustBlock({ partNumber, locale = 'en', className }: TrustBlockProps) {
  const ar = locale === 'ar'
  const warrantyLabel = ar ? WARRANTY_BADGE_AR : WARRANTY_BADGE_EN
  const rmaLabel = ar ? RMA_BADGE_AR : RMA_BADGE_EN
  const isoPrefix = ar ? ISO_LABEL_AR : ISO_LABEL_EN
  const waLabel = ar ? CONTACT_LABEL_WHATSAPP_AR : CONTACT_LABEL_WHATSAPP_EN
  const emailLabel = ar ? CONTACT_LABEL_EMAIL_AR : CONTACT_LABEL_EMAIL_EN
  const phoneLabel = ar ? CONTACT_LABEL_PHONE_AR : CONTACT_LABEL_PHONE_EN
  const waHref = buildWhatsAppHref(partNumber, locale)
  const telHref = supportPhoneTelHref()

  return (
    <div data-testid="trust-block" className={cn('space-y-4 rounded-xl border border-[--border] bg-[--bg-elevated] p-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" size="sm">
          {warrantyLabel}
        </Badge>
        <Link href="/policies/rma" className="inline-flex transition-opacity hover:opacity-90">
          <Badge variant="success" size="sm">
            {rmaLabel}
          </Badge>
        </Link>
      </div>

      {ISO_CERTIFICATIONS.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[--text-secondary]">{isoPrefix}</span>
          {ISO_CERTIFICATIONS.map((c) => (
            <Badge key={c.name} variant="info" size="sm">
              {c.year != null ? `${c.name} (${c.year})` : c.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <ul className="space-y-1.5 text-xs text-[--text-secondary]">
        {COMPANY_TRUST_STATEMENTS.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100',
            'transition-colors hover:bg-emerald-500/20',
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {waLabel}
        </a>
        {CONTACT_EMAIL ? (
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl border border-[--border] bg-[--bg-muted] px-3 py-2 text-xs font-bold text-[--text-primary]',
              'transition-colors hover:border-[--accent]/40',
            )}
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {emailLabel}
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl border border-[--border] bg-[--bg-muted] px-3 py-2 text-xs font-bold text-[--text-primary]',
              'transition-colors hover:border-[--accent]/40',
            )}
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {phoneLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}
