'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as adminService from '@/features/admin/services/adminService'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, type DataTableColumnMeta, Badge, Button, Modal, Input, Select } from '@/components/ui'
import type { RFQDetail } from '@/types/rfq'
import { formatRfqStatusLabel } from '@/lib/rfqExperience'
import toast from 'react-hot-toast'

const STATUS_BADGE_MAP: Record<string, 'pending' | 'info' | 'success' | 'default' | 'error'> = {
  pending: 'pending',
  in_progress: 'info',
  quoted: 'success',
  closed: 'default',
  cancelled: 'error',
}

export default function AdminRFQPage() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<RFQDetail | null>(null)
  const [formState, setFormState] = useState({
    status: 'quoted',
    quoted_price_usd: '',
    lead_time: '',
    admin_notes: '',
  })

  const statsQuery = useQuery({
    queryKey: ['admin-rfq-stats'],
    queryFn: adminService.getAdminRFQStats,
  })

  const rfqsQuery = useQuery({
    queryKey: ['admin-rfqs', { status: filterStatus }],
    queryFn: () => adminService.getAdminRFQs({ status: filterStatus || undefined, size: 100 }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminService.updateAdminRFQ>[1] }) =>
      adminService.updateAdminRFQ(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-rfq-stats'] })
      setSelected(null)
      toast.success('RFQ updated')
    },
    onError: () => toast.error('Failed to update RFQ'),
  })

  const openEdit = useCallback((rfq: RFQDetail) => {
    setSelected(rfq)
    setFormState({
      status: rfq.status === 'pending' ? 'quoted' : rfq.status,
      quoted_price_usd: rfq.quoted_price_usd ? String(rfq.quoted_price_usd) : '',
      lead_time: rfq.lead_time ?? '',
      admin_notes: rfq.admin_notes ?? '',
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!selected) return
    if (formState.status === 'quoted') {
      const price = parseFloat(formState.quoted_price_usd)
      if (!Number.isFinite(price) || price <= 0) {
        toast.error('Enter a positive quoted price (USD) before setting status to Quoted.')
        return
      }
    }
    if (
      formState.status === 'quoted' &&
      selected.status !== 'quoted' &&
      !window.confirm(
        'Set status to Quoted? This typically emails the customer with the quote. Continue?',
      )
    ) {
      return
    }
    const data: Record<string, unknown> = { status: formState.status }
    if (formState.quoted_price_usd) data.quoted_price_usd = parseFloat(formState.quoted_price_usd)
    if (formState.lead_time) data.lead_time = formState.lead_time
    if (formState.admin_notes) data.admin_notes = formState.admin_notes
    updateMutation.mutate({ id: selected.id, data })
  }, [selected, formState, updateMutation])

  const stats = statsQuery.data
  const rfqs = rfqsQuery.data?.rfqs ?? []
  const statCards = [
    { label: 'Total', value: stats?.total ?? 0 },
    { label: 'Pending', value: stats?.pending ?? 0 },
    { label: 'Quoted', value: stats?.quoted ?? 0 },
    { label: 'Closed', value: stats?.closed ?? 0 },
  ]

  const columns: ColumnDef<RFQDetail & Record<string, unknown>, unknown>[] = useMemo(
    () => [
      {
        id: 'reference',
        header: 'Reference',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-white/50">{row.original.reference}</span>
        ),
      },
      {
        id: 'part_number',
        header: 'Part Number',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-orange-300">{row.original.part_number}</span>
        ),
      },
      {
        id: 'quantity',
        header: 'Qty',
        cell: ({ row }) => <span className="text-white/80">{row.original.quantity}</span>,
      },
      {
        id: 'company',
        header: 'Company',
        meta: { className: 'max-w-[120px]' } as DataTableColumnMeta,
        cell: ({ row }) => (
          <span className="block max-w-[120px] truncate text-white/80">{row.original.company ?? '—'}</span>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <a href={`mailto:${row.original.email}`} className="text-xs text-sky-400 hover:text-sky-300 hover:underline">
            {row.original.email}
          </a>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE_MAP[row.original.status] ?? 'default'} size="sm">
            {formatRfqStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'quoted_price_usd',
        header: 'Price',
        cell: ({ row }) => (
          <span className="text-xs text-white/80">
            {row.original.quoted_price_usd ? `$${Number(row.original.quoted_price_usd).toFixed(2)}` : '—'}
          </span>
        ),
      },
      {
        id: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-white/50">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row.original as RFQDetail) }}>
            {row.original.status === 'pending' ? 'Quote' : 'Edit'}
          </Button>
        ),
      },
    ],
    [openEdit],
  )

  const filterTabs = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'closed', label: 'Closed' },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">RFQ Management</h1>
          <p className="mt-0.5 text-sm text-white/50">View and respond to quote requests</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-0.5 text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-white/10 pb-px">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                filterStatus === tab.value
                  ? 'text-orange-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-400'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          tableId="admin-rfq"
          columns={columns}
          data={rfqs as (RFQDetail & Record<string, unknown>)[]}
          isLoading={rfqsQuery.isLoading}
          emptyState={
            <p className="py-10 text-center text-sm text-white/50">
              {`No RFQs${filterStatus ? ` with status "${filterStatus}"` : ''}`}
            </p>
          }
          getRowId={(row) => String(row.id)}
          stickyHeader
        />
      </div>

      {selected && (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Respond to RFQ"
          description={`${selected.part_number} — Qty: ${selected.quantity} — ${selected.reference}`}
        >
          <div className="space-y-4 py-2">
            {selected.message && (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/50">
                <strong className="text-white">Customer note:</strong> {selected.message}
              </div>
            )}

            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min={0}
              value={formState.quoted_price_usd}
              onChange={(e) => setFormState((s) => ({ ...s, quoted_price_usd: e.target.value }))}
              helperText='Triggers quote email when status is "Quoted"'
            />
            <Input
              label="Lead Time"
              value={formState.lead_time}
              onChange={(e) => setFormState((s) => ({ ...s, lead_time: e.target.value }))}
              placeholder="e.g. 3-5 business days"
            />
            <div className="w-full">
              <label htmlFor="admin-rfq-notes" className="mb-1 block text-xs font-medium text-white/50">
                Admin Notes (internal)
              </label>
              <textarea
                id="admin-rfq-notes"
                value={formState.admin_notes}
                onChange={(e) => setFormState((s) => ({ ...s, admin_notes: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/20"
              />
            </div>
            <Select
              label="Status"
              value={formState.status}
              onChange={(v) => setFormState((s) => ({ ...s, status: v }))}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'quoted', label: 'Quoted (sends email)' },
                { value: 'closed', label: 'Closed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            {updateMutation.isError && (
              <p className="text-xs text-red-500">Failed to update RFQ. Please try again.</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={updateMutation.isPending}
                onClick={handleSave}
              >
                Save Response
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
