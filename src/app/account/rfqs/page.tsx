'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import * as rfqService from '@/features/rfq/services/rfqService'
import { getApiErrorMessage } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUIStore } from '@/state/uiStore'
import type { RFQDetail } from '@/types/rfq'
import { getRfqHumanStatusLabel } from '@/lib/rfqExperience'
import { RfqStatusTimeline } from '@/components/rfq/RfqStatusTimeline'
import { RfqTrustFooterStrip } from '@/components/rfq/RfqSuccessTrustBlock'

const STATUS_BADGE_MAP: Record<string, 'pending' | 'info' | 'success' | 'default' | 'error'> = {
  new: 'pending',
  pending: 'pending',
  in_progress: 'info',
  contacted: 'info',
  quoted: 'success',
  closed: 'default',
  cancelled: 'error',
  approved: 'success',
  completed: 'success',
}

const heroShell =
  'rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8'

const cardShell =
  'rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors hover:border-white/[0.14] sm:p-6'

function RfqListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cardShell}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Skeleton variant="rect" height={20} className="w-40 rounded-md bg-white/10" />
            <Skeleton variant="rect" height={24} className="w-24 rounded-full bg-white/10" />
          </div>
          <Skeleton variant="rect" height={14} className="mt-4 w-3/5 rounded-md bg-white/10" />
          <Skeleton variant="rect" height={80} className="mt-4 w-full rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export default function CustomerRfqListPage() {
  const openRFQModal = useUIStore((s) => s.openRFQModal)
  const [email, setEmail] = useState('')
  const [inputEmail, setInputEmail] = useState('')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('rfq_email') : null
    if (stored) {
      setEmail(stored)
      setInputEmail(stored)
    }
  }, [])

  const rfqsQuery = useQuery({
    queryKey: ['my-rfqs', email],
    queryFn: () => rfqService.getMyRFQs(email, { limit: 100 }),
    enabled: email.includes('@'),
  })

  const handleLookup = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const normalized = inputEmail.trim().toLowerCase()
      if (!normalized.includes('@')) return
      if (typeof window !== 'undefined') localStorage.setItem('rfq_email', normalized)
      setEmail(normalized)
    },
    [inputEmail],
  )

  const rfqs = rfqsQuery.data?.rfqs ?? []
  const total = rfqsQuery.data?.total ?? 0

  return (
    <div className="relative min-h-screen pb-24 pt-8 sm:pt-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,520px)] -translate-x-1/2 rounded-full bg-orange-500/12 blur-[100px]" aria-hidden />
      <div className="page-container relative z-10">
        <nav className="mb-6 text-xs text-white/45">
          <Link href="/" className="transition-colors hover:text-orange-200/90">
            Home
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <span className="text-white/70">My RFQs</span>
        </nav>

        <header className={heroShell}>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Track your quote requests</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Every request has a clear reference and a simple progress timeline. Enter the email you used when you submitted — we
            never show RFQs for any other address.
          </p>
        </header>

        <div className="mt-8 space-y-8">
          <form
            onSubmit={handleLookup}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-end sm:p-6"
          >
            <div className="min-w-0 flex-1 sm:max-w-md">
              <Input
                label="Your email"
                type="email"
                required
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" variant="primary" loading={rfqsQuery.isFetching} className="sm:shrink-0">
              Load my RFQs
            </Button>
          </form>

          {rfqsQuery.isError && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100/95">
              {getApiErrorMessage(
                rfqsQuery.error,
                'Could not load RFQs. Check your connection and try again.',
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/50">
              {email
                ? (
                    <>
                      <span className="font-medium text-white/75">{total}</span> request{total !== 1 ? 's' : ''} for{' '}
                      <span className="text-orange-200/85">{email}</span>
                    </>
                  )
                : 'Enter your email to see every quote request tied to that address.'}
            </p>
            <Button variant="secondary" size="sm" type="button" onClick={() => openRFQModal()}>
              Request a Quote
            </Button>
          </div>

          {email && rfqsQuery.isLoading ? <RfqListSkeleton /> : null}

          {email && !rfqsQuery.isLoading && !rfqsQuery.isError && rfqs.length > 0 ? (
            <div className="grid gap-4">
              {rfqs.map((row: RFQDetail) => (
                <article key={row.id} className={cardShell}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Reference</p>
                      <Link
                        href={`/account/rfqs/${encodeURIComponent(row.reference)}`}
                        className="mt-1 inline-block font-mono text-lg font-bold tracking-tight text-orange-100 transition-colors hover:text-orange-50"
                      >
                        {row.reference}
                      </Link>
                      <p className="mt-2 text-sm text-white/55">
                        <Link
                          href={`/products/${encodeURIComponent(row.part_number)}`}
                          className="font-mono text-sm text-white/80 transition-colors hover:text-orange-200/90"
                        >
                          {row.part_number}
                        </Link>
                        <span className="text-white/35"> · </span>
                        <span className="text-white/60">Qty {row.quantity}</span>
                        {row.quoted_price_usd != null ? (
                          <>
                            <span className="text-white/35"> · </span>
                            <span className="text-white/75">${Number(row.quoted_price_usd).toFixed(2)} quoted</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE_MAP[row.status] ?? 'default'} size="sm" className="shrink-0 self-start">
                      {getRfqHumanStatusLabel(row.status)}
                    </Badge>
                  </div>

                  <RfqStatusTimeline
                    rfq={row}
                    compact
                    cancelledNote="This request was cancelled — you can open a new quote anytime."
                  />

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-white/[0.08] pt-4">
                    <Button variant="primary" size="sm" asChild>
                      <Link href={`/account/rfqs/${encodeURIComponent(row.reference)}`}>View details</Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/products/${encodeURIComponent(row.part_number)}`}>Product page</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {email && !rfqsQuery.isLoading && rfqs.length === 0 && !rfqsQuery.isError ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-sm transition-all duration-300">
              <Package className="mx-auto h-12 w-12 text-white/20" aria-hidden />
              <p className="mt-4 text-base font-medium text-white/80">No quote requests for this email yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
                When you request a quote from a product page, your reference and timeline will show up here automatically. Same
                email, same place — nothing to configure.
              </p>
              <Button variant="primary" className="mt-8" type="button" onClick={() => openRFQModal()}>
                Request a Quote
              </Button>
            </div>
          ) : null}

          <RfqTrustFooterStrip className="mt-16 border-t border-white/[0.08] pt-8" withTopBorder={false} />
        </div>
      </div>
    </div>
  )
}
