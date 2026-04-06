'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as rfqService from '@/services/rfqService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const STATUS_BADGE_MAP: Record<string, 'pending' | 'info' | 'success' | 'default' | 'error'> = {
  pending: 'pending',
  in_progress: 'info',
  quoted: 'success',
  closed: 'default',
  cancelled: 'error',
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="py-3 border-b border-[#F3F4F6] last:border-0 flex flex-col sm:flex-row sm:items-center gap-1">
      <dt className="text-sm text-[#6B7280] font-medium sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-[#1A1A1A]">{value}</dd>
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
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-[#6B7280] mb-3">
            <Link href="/" className="hover:text-[#0072CE]">Home</Link>
            <span className="mx-1">/</span>
            <Link href="/account/rfqs" className="hover:text-[#0072CE]">My RFQs</Link>
            <span className="mx-1">/</span>
            <span className="text-[#1A1A1A] font-mono">{reference}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">RFQ Detail</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rfqQuery.isLoading && (
          <div className="max-w-2xl space-y-4">
            <Skeleton variant="rect" height={200} className="w-full" />
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={16} />
          </div>
        )}

        {rfqQuery.isError && (
          <div className="rounded-[4px] border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-[#EF4444] mb-4">RFQ not found or failed to load.</p>
            <Link href="/account/rfqs" className="text-sm text-[#0072CE] hover:underline">
              Back to My RFQs
            </Link>
          </div>
        )}

        {rfq && !rfqQuery.isLoading && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-lg font-bold text-[#1A1A1A]">{rfq.reference}</h2>
                <Badge variant={STATUS_BADGE_MAP[rfq.status] ?? 'default'} size="md">
                  {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                </Badge>
              </div>

              <dl>
                <DetailRow
                  label="Part Number"
                  value={
                    <Link href={`/products/${encodeURIComponent(rfq.part_number)}`} className="text-[#0072CE] hover:underline font-medium font-mono">
                      {rfq.part_number}
                    </Link>
                  }
                />
                <DetailRow label="Quantity" value={rfq.quantity} />
                <DetailRow
                  label="Quoted Price"
                  value={rfq.quoted_price_usd != null ? `$${Number(rfq.quoted_price_usd).toFixed(2)}` : null}
                />
                <DetailRow label="Lead Time" value={rfq.lead_time} />
                <DetailRow label="Company" value={rfq.company} />
                <DetailRow label="Contact" value={rfq.contact_name} />
                <DetailRow label="Email" value={rfq.email} />
                <DetailRow label="Phone" value={rfq.phone} />
                <DetailRow label="Country" value={rfq.country} />
                <DetailRow label="Message" value={rfq.message} />
                <DetailRow label="Submitted" value={new Date(rfq.created_at).toLocaleString()} />
                {rfq.updated_at && (
                  <DetailRow label="Last Updated" value={new Date(rfq.updated_at).toLocaleString()} />
                )}
              </dl>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" asChild>
                <Link href="/account/rfqs">Back to My RFQs</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href={`/products/${encodeURIComponent(rfq.part_number)}`}>View Product</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
