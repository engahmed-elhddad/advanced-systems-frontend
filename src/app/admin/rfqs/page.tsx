'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Search, Inbox } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Badge, Button, Card, Skeleton } from '@/components/ui'
import { useRFQs, type AdminRfq, type RfqUiStatus } from '@/hooks/useRFQs'
import { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

const RFQ_STATUS_TABS: Array<RfqUiStatus | 'All'> = ['All', 'New', 'Contacted', 'Quoted', 'Closed']

function statusBadge(status: RfqUiStatus) {
  switch (status) {
    case 'New':
      return { variant: 'new' as const, className: '' }
    case 'Contacted':
      return { variant: 'pending' as const, className: '' }
    case 'Quoted':
      return { variant: 'default' as const, className: 'bg-purple-100 text-purple-700' }
    case 'Closed':
      return { variant: 'success' as const, className: '' }
    default:
      return { variant: 'default' as const, className: '' }
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
    <AdminLayout>
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

        <Card className="border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="hidden grid-cols-6 gap-3 px-4 pb-2 text-xs uppercase tracking-wider text-gray-400 md:grid">
            <span>Name</span>
            <span>Product</span>
            <span>Quantity</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          {rfqsQuery.isLoading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Inbox className="h-7 w-7 text-gray-400" />
              <p className="text-base text-gray-200">No RFQs yet</p>
              <p className="text-sm text-gray-400">Try another status or search keyword.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((rfq: AdminRfq) => {
                const b = statusBadge(rfq.status)
                return (
                  <div
                    key={rfq.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-white/10 hover:shadow-[0_0_26px_rgba(255,255,255,0.08)] md:grid-cols-6 md:items-center"
                  >
                    <div className="text-sm font-medium text-white">{rfq.name}</div>
                    <div className="text-sm text-gray-200">{rfq.product}</div>
                    <div className="text-sm text-gray-300">{rfq.quantity}</div>
                    <div>
                      <Badge variant={b.variant} className={b.className}>
                        {rfq.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300">{rfq.date}</div>
                    <div className="md:text-right">
                      <Button asChild size="sm" variant="secondary" className="bg-white/10 text-white border-white/15 hover:bg-white/20">
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
        </Card>
      </div>
    </AdminLayout>
  )
}
