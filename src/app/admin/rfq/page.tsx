'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as adminService from '@/features/admin/services/adminService'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTableLegacy'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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

  const columns: DataTableColumn<RFQDetail & Record<string, unknown>>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className="font-mono text-xs text-[#6B7280]">{row.reference}</span>,
    },
    {
      key: 'part_number',
      header: 'Part Number',
      render: (row) => <span className="font-mono font-semibold text-[#0072CE]">{row.part_number}</span>,
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (row) => <span>{row.quantity}</span>,
    },
    {
      key: 'company',
      header: 'Company',
      className: 'max-w-[120px]',
      render: (row) => <span className="truncate block max-w-[120px]">{row.company ?? '—'}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <a href={`mailto:${row.email}`} className="text-[#0072CE] hover:underline text-xs">
          {row.email}
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_BADGE_MAP[row.status] ?? 'default'} size="sm">
          {formatRfqStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'quoted_price_usd',
      header: 'Price',
      render: (row) => (
        <span className="text-xs">{row.quoted_price_usd ? `$${Number(row.quoted_price_usd).toFixed(2)}` : '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-[#6B7280] whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row as RFQDetail)}>
          {row.status === 'pending' ? 'Quote' : 'Edit'}
        </Button>
      ),
    },
  ]

  const filterTabs = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'closed', label: 'Closed' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">RFQ Management</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">View and respond to quote requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-[4px] p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-[#E5E7EB] pb-px">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                filterStatus === tab.value
                  ? 'text-[#0072CE] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0072CE]'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <DataTable
          allowLegacyTable
          columns={columns}
          data={rfqs as (RFQDetail & Record<string, unknown>)[]}
          loading={rfqsQuery.isLoading}
          emptyMessage={`No RFQs${filterStatus ? ` with status "${filterStatus}"` : ''}`}
          rowKey={(row) => String(row.id)}
          stickyHeader
        />
      </div>

      {/* Edit Modal */}
      {selected && (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Respond to RFQ"
          description={`${selected.part_number} — Qty: ${selected.quantity} — ${selected.reference}`}
        >
          <div className="space-y-4 py-2">
            {selected.message && (
              <div className="rounded-[2px] bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-2 text-sm text-[#6B7280]">
                <strong className="text-[#1A1A1A]">Customer note:</strong> {selected.message}
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
              <label htmlFor="admin-rfq-notes" className="mb-1 block text-xs font-medium text-[#6B7280]">Admin Notes (internal)</label>
              <textarea
                id="admin-rfq-notes"
                value={formState.admin_notes}
                onChange={(e) => setFormState((s) => ({ ...s, admin_notes: e.target.value }))}
                rows={2}
                className="w-full border border-[#E5E7EB] rounded-[2px] px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#0072CE] focus:ring-1 focus:ring-[#0072CE]/20 resize-none"
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
              <p className="text-[#EF4444] text-xs">Failed to update RFQ. Please try again.</p>
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
