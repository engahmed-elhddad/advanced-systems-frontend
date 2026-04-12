'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as rfqService from '@/features/rfq/services/rfqService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { getRfqHumanStatusLabel, getRfqStatusCustomerSummary } from '@/lib/rfqExperience'
import { RfqStatusTimeline } from '@/components/rfq/RfqStatusTimeline'

const STATUS_BADGE_MAP: Record<string, 'pending' | 'info' | 'success' | 'default' | 'error'> = {
  new: 'pending',
  pending: 'pending',
  in_progress: 'info',
  contacted: 'info',
  quoted: 'success',
  closed: 'default',
  cancelled: 'error',
}

const card =
  'rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.07] py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-white/85">{value}</dd>
    </div>
  )
}

export default function RfqDetailPage() {
  const params = useParams<{ reference: string }>()
  const reference = params.reference ?? ''

  const rfqQuery = useQuery({
    queryKey: ['rfq-detail', reference],
    queryFn: () => rfqService.getRFQByReference(reference),
    enabled: Boolean(reference),
  })

  const rfq = rfqQuery.data

  return (
    <div className="relative min-h-screen pb-24 pt-8 sm:pt-12">
      <div className="pointer-events-none absolute right-0 top-24 h-48 w-48 rounded-full bg-violet-500/15 blur-[100px]" aria-hidden />
      <div className="page-container relative z-10 max-w-3xl">
        <nav className="mb-6 text-xs text-white/45">
          <Link href="/" className="transition-colors hover:text-orange-200/90">
            Home
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <Link href="/account/rfqs" className="transition-colors hover:text-orange-200/90">
            My RFQs
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <span className="font-mono text-white/60">{reference}</span>
        </nav>

        {rfqQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton variant="rect" height={180} className="w-full rounded-2xl bg-white/10" />
            <Skeleton width="55%" height={14} className="bg-white/10" />
            <Skeleton width="40%" height={14} className="bg-white/10" />
          </div>
        )}

        {rfqQuery.isError && (
          <div className={card}>
            <p className="text-center text-red-200/95">We couldn&apos;t load this RFQ. Check the reference or try again later.</p>
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" asChild>
                <Link href="/account/rfqs">Back to My RFQs</Link>
              </Button>
            </div>
          </div>
        )}

        {rfq && !rfqQuery.isLoading && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={card}>
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200/80">Reference</p>
                  <h1 className="mt-1 font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">{rfq.reference}</h1>
                </div>
                <Badge variant={STATUS_BADGE_MAP[rfq.status] ?? 'default'} size="md" className="shrink-0">
                  {getRfqHumanStatusLabel(rfq.status)}
                </Badge>
              </div>
              <p className="mt-5 rounded-xl border border-white/[0.08] bg-violet-500/[0.08] px-4 py-3 text-sm leading-relaxed text-white/70">
                {getRfqStatusCustomerSummary(rfq.status)}
              </p>

              <RfqStatusTimeline
                rfq={rfq}
                cancelledNote="This request was cancelled. Start a new quote from the product page whenever you are ready."
              />

              <dl className="mt-6">
                <DetailRow
                  label="Part"
                  value={
                    <Link
                      href={`/products/${encodeURIComponent(rfq.part_number)}`}
                      className="font-mono font-medium text-orange-200/95 hover:text-orange-100"
                    >
                      {rfq.part_number}
                    </Link>
                  }
                />
                <DetailRow label="Quantity" value={rfq.quantity} />
                <DetailRow
                  label="Quoted price"
                  value={rfq.quoted_price_usd != null ? `$${Number(rfq.quoted_price_usd).toFixed(2)} USD` : null}
                />
                <DetailRow label="Lead time" value={rfq.lead_time} />
                <DetailRow label="Company" value={rfq.company} />
                <DetailRow label="Contact" value={rfq.contact_name} />
                <DetailRow label="Email" value={rfq.email} />
                <DetailRow label="Phone" value={rfq.phone} />
                <DetailRow label="Country" value={rfq.country} />
                <DetailRow label="Your message" value={rfq.message} />
                <DetailRow label="Submitted" value={new Date(rfq.created_at).toLocaleString()} />
                {rfq.updated_at ? (
                  <DetailRow label="Last updated" value={new Date(rfq.updated_at).toLocaleString()} />
                ) : null}
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/account/rfqs">All my RFQs</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href={`/products/${encodeURIComponent(rfq.part_number)}`}>View product</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
