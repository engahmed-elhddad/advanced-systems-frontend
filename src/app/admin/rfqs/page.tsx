'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Search, Inbox } from 'lucide-react'
import { Badge, Button, Card, Skeleton } from '@/components/ui'
import { useRFQs, type AdminRfq, type RfqUiStatus } from '@/features/rfq/hooks/useRFQs'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

const RFQ_STATUS_TABS: Array<RfqUiStatus | 'All'> = ['All', 'New', 'Contacted', 'Quoted', 'Closed']

function statusBadge(status: RfqUiStatus) {
  switch (status) {
    case 'New':
      return 'new' as const
    case 'Contacted':
      return 'contacted' as const
    case 'Quoted':
      return 'quoted' as const
    case 'Closed':
      return 'closed' as const
    default:
      return 'default' as const
  }
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg border border-white/10 bg-white/10" />
      ))}
    </div>
  )
}

export default function AdminRfqsPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<RfqUiStatus | 'All'>('All')
  const rfqsQuery = useRFQs({
    page: 1,
    size: 100,
    status:
      activeTab === 'All'
        ? undefined
        : activeTab === 'New'
          ? 'pending'
          : activeTab === 'Contacted'
            ? 'in_progress'
            : activeTab.toLowerCase(),
  })
  useEffect(() => {
    if (rfqsQuery.isError) {
      toast.error(getApiErrorMessage(rfqsQuery.error, 'Failed to load RFQs'))
    }
  }, [rfqsQuery.isError, rfqsQuery.error])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rfqs = rfqsQuery.data?.items ?? []
    return rfqs.filter((r) => {
      const statusOk = activeTab === 'All' ? true : r.status === activeTab
      const queryOk = !q || r.name.toLowerCase().includes(q) || r.product.toLowerCase().includes(q)
      return statusOk && queryOk
    })
  }, [rfqsQuery.data?.items, query, activeTab])

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">RFQ Pipeline</h1>
            <p className="mt-1 text-sm text-gray-300">Manage inbound requests, prioritize, and convert faster.</p>
          </div>

          <div className="relative w-full lg:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or product..."
              aria-label="Search RFQs"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 backdrop-blur-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:shadow-[0_0_24px_rgba(255,122,0,0.18)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
          {RFQ_STATUS_TABS.map((tab) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-label={`Filter RFQs by ${tab}`}
                className={`relative rounded-lg px-3 py-1.5 text-sm transition-all duration-300 ease-in-out ${
                  active ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                {tab}
                <span
                  className={`absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-[#FF7A00] transition-all duration-300 ${
                    active ? 'opacity-100 shadow-[0_0_14px_rgba(255,122,0,0.8)]' : 'opacity-0'
                  }`}
                />
              </button>
            )
          })}
        </div>

        <Card hover={false} className="p-0" padding="none">
          <div className="hidden grid-cols-6 gap-3 px-5 pb-3 pt-4 text-xs font-semibold uppercase tracking-wider text-white/45 md:grid">
            <span>Name</span>
            <span>Product</span>
            <span>Quantity</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="space-y-3 p-4 pt-0">
          {rfqsQuery.isLoading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Inbox className="h-7 w-7 text-white/40" />
              <p className="text-base text-white/90">No RFQs yet</p>
              <p className="text-sm text-white/45">Try another status or search keyword.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((rfq: AdminRfq) => {
                const variant = statusBadge(rfq.status)
                return (
                  <div
                    key={rfq.id}
                    className="grid grid-cols-1 gap-3 rounded-xl bg-white/[0.04] px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:shadow-[0_0_28px_rgba(255,122,0,0.1),0_0_40px_rgba(168,85,247,0.08)] md:grid-cols-6 md:items-center"
                  >
                    <div className="text-sm font-medium text-white">{rfq.name}</div>
                    <div className="text-sm text-white/80">{rfq.product}</div>
                    <div className="text-sm text-white/55">{rfq.quantity}</div>
                    <div>
                      <Badge variant={variant}>
                        {rfq.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-white/55">{rfq.date}</div>
                    <div className="md:text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/rfqs/${rfq.id}`} aria-label={`View RFQ ${rfq.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </Card>
      </div>
  )
}
