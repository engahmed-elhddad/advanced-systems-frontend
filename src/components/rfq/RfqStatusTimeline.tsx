'use client'

import { Check } from 'lucide-react'
import type { RFQDetail } from '@/types/rfq'
import { buildRfqTimeline } from '@/lib/rfqExperience'
import { cn } from '@/lib/utils'

type Props = {
  rfq: Pick<RFQDetail, 'status' | 'created_at' | 'updated_at'>
  compact?: boolean
  cancelledNote?: string
}

export function RfqStatusTimeline({ rfq, compact, cancelledNote }: Props) {
  const steps = buildRfqTimeline(rfq)
  const cancelled =
    String(rfq.status || '')
      .trim()
      .toLowerCase() === 'cancelled'

  return (
    <div className={cn('w-full', compact ? 'mt-3' : 'mt-4')}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Progress</p>
      <ol className="mt-3 space-y-0" role="list">
        {steps.map((step, i) => {
          const last = i === steps.length - 1
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                    step.complete
                      ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                      : step.current
                        ? 'border-orange-400/45 bg-orange-500/15 text-orange-100'
                        : 'border-white/15 bg-white/[0.04] text-white/35',
                  )}
                  aria-hidden
                >
                  {step.complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {!last ? (
                  <div
                    className={cn(
                      'w-px flex-1 min-h-[20px] bg-gradient-to-b from-white/20 to-white/5',
                      compact && 'min-h-[14px]',
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn('min-w-0 flex-1', !last && 'pb-4', last && compact && 'pb-0')}>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    step.complete || step.current ? 'text-white/90' : 'text-white/40',
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/45">
                  {step.timestampLabel ?? (step.current ? 'In progress' : 'Pending')}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
      {cancelled && cancelledNote ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-200/80">{cancelledNote}</p>
      ) : null}
    </div>
  )
}
