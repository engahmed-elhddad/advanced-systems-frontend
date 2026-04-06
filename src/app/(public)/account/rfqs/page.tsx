'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import * as rfqService from '@/services/rfqService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { useUIStore } from '@/state/uiStore'
import type { RFQDetail } from '@/types/rfq'

const STATUS_BADGE_MAP: Record<string, 'pending' | 'info' | 'success' | 'default' | 'error'> = {
  pending: 'pending',
  in_progress: 'info',
  quoted: 'success',
  closed: 'default',
  cancelled: 'error',
  approved: 'success',
  completed: 'success',
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
    queryFn: () => rfqService.getMyRFQs(email),
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

  const columns: DataTableColumn<RFQDetail & Record<string, unknown>>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <Link href={`/account/rfqs/${row.reference}`} className="font-mono text-xs text-[#0072CE] hover:underline">
          {row.reference}
        </Link>
      ),
    },
    {
      key: 'part_number',
      header: 'Part Number',
      render: (row) => (
        <Link href={`/products/${encodeURIComponent(row.part_number)}`} className="font-mono font-semibold text-[#1A1A1A] hover:text-[#0072CE]">
          {row.part_number}
        </Link>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (row) => <span>{row.quantity}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_BADGE_MAP[row.status] ?? 'default'} size="sm">
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'quoted_price_usd',
      header: 'Price',
      render: (row) => (
        <span className="text-sm">{row.quoted_price_usd != null ? `$${Number(row.quoted_price_usd).toFixed(2)}` : '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-[#6B7280]">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row) => (
        <Link href={`/account/rfqs/${row.reference}`} className="text-xs text-[#0072CE] hover:underline font-medium">
          View
        </Link>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-[#6B7280] mb-3">
            <Link href="/" className="hover:text-[#0072CE]">Home</Link>
            <span className="mx-1">/</span>
            <span className="text-[#1A1A1A]">My RFQs</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">My Quote Requests</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Track the status of your RFQ submissions.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Email lookup */}
        <form onSubmit={handleLookup} className="flex gap-3 items-end">
          <div className="flex-1 max-w-sm">
            <Input
              label="Your email"
              type="email"
              required
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" variant="primary" loading={rfqsQuery.isLoading}>
            Look Up
          </Button>
        </form>

        {rfqsQuery.isError && (
          <div className="rounded-[4px] border border-red-200 bg-red-50 p-4 text-sm text-[#EF4444]">
            Failed to load RFQs. Please try again.
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6B7280]">
            {email ? `${total} quote request${total !== 1 ? 's' : ''} for ${email}` : 'Enter your email to see your RFQs'}
          </p>
          <Button variant="primary" size="sm" onClick={() => openRFQModal()}>
            + Submit New RFQ
          </Button>
        </div>

        {/* RFQ table */}
        {email && (
          <DataTable
            columns={columns}
            data={rfqs as (RFQDetail & Record<string, unknown>)[]}
            loading={rfqsQuery.isLoading}
            emptyMessage={`No RFQs found for ${email}`}
            rowKey={(row) => String(row.id)}
          />
        )}

        {email && !rfqsQuery.isLoading && rfqs.length === 0 && !rfqsQuery.isError && (
          <div className="text-center py-16 rounded-[4px] border border-[#E5E7EB] bg-white">
            <p className="text-[#6B7280] mb-4">No RFQs found for <strong>{email}</strong></p>
            <Button variant="primary" onClick={() => openRFQModal()}>
              Submit Your First RFQ
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
