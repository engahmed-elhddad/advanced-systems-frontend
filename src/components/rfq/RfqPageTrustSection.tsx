import { Building2, MapPin, Shield } from 'lucide-react'
import {
  COMPANY_BUSINESS_MODEL,
  COMPANY_LOCATION_SINGLE_LINE,
  COMPANY_NAME_EN,
  COMPANY_TRUST_STATEMENTS,
} from '@/lib/company'
import { cn } from '@/lib/utils'

const glass =
  'rounded-xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl'

export function RfqPageTrustSection({ className }: { className?: string }) {
  return (
    <section
      aria-label="Company trust and credentials"
      className={cn(glass, 'p-5 sm:p-6', className)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-200">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-orange-200/90">Who you&apos;re quoting with</h2>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-white">{COMPANY_NAME_EN}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2" role="list">
        {COMPANY_TRUST_STATEMENTS.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/70">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {COMPANY_BUSINESS_MODEL.map((line) => (
          <span
            key={line}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/65"
          >
            {line}
          </span>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/45">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
        <span>{COMPANY_LOCATION_SINGLE_LINE}</span>
      </p>
    </section>
  )
}
