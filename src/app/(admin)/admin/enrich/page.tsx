'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as adminService from '@/services/adminService'
import * as productService from '@/services/productService'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types/product'

export default function AdminEnrichPage() {
  const queryClient = useQueryClient()
  const [enrichResults, setEnrichResults] = useState<Record<number, { status: string; message: string }>>({})

  const statsQuery = useQuery({
    queryKey: ['enrich-stats'],
    queryFn: adminService.getEnrichStats,
    refetchInterval: 30_000,
  })

  const productsQuery = useQuery({
    queryKey: ['admin-products-for-enrich'],
    queryFn: () => productService.getProducts({ size: 50, page: 1 }),
  })

  const enrichMutation = useMutation({
    mutationFn: (productId: number) => adminService.enrichProduct(productId),
    onSuccess: (data, productId) => {
      const updated = data.updated_fields ?? []
      const msg = updated.length > 0
        ? `Updated: ${updated.join(', ')}`
        : 'Already complete'
      setEnrichResults((prev) => ({
        ...prev,
        [productId]: { status: 'success', message: msg },
      }))
      queryClient.invalidateQueries({ queryKey: ['enrich-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products-for-enrich'] })
    },
    onError: (_err, productId) => {
      setEnrichResults((prev) => ({
        ...prev,
        [productId]: { status: 'error', message: 'Enrichment failed' },
      }))
    },
  })

  const batchMutation = useMutation({
    mutationFn: () => adminService.enqueueBatch({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrich-stats'] })
    },
  })

  const stats = statsQuery.data
  const products = productsQuery.data?.items ?? []
  const percentEnriched = stats?.percent_enriched ?? 0

  const columns: DataTableColumn<Product & Record<string, unknown>>[] = [
    {
      key: 'part_number',
      header: 'Part Number',
      render: (row) => <span className="font-mono font-semibold text-[#0072CE]">{row.part_number}</span>,
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (row) => <span className="text-sm">{row.brand ?? '—'}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-sm">{row.category ?? '—'}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-[280px]',
      render: (row) => {
        const desc = row.description
        return desc ? (
          <span className="text-sm truncate block max-w-[280px]">{desc}</span>
        ) : (
          <span className="text-sm text-amber-600 font-medium">Missing</span>
        )
      },
    },
    {
      key: 'is_enriched',
      header: 'Enriched',
      render: (row) => (
        <Badge variant={row.is_enriched ? 'success' : 'warning'} size="sm">
          {row.is_enriched ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row) => {
        const result = enrichResults[row.id]
        if (result) {
          return (
            <span className={`text-xs font-medium ${result.status === 'success' ? 'text-emerald-600' : 'text-[#EF4444]'}`}>
              {result.message}
            </span>
          )
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            loading={enrichMutation.isPending && enrichMutation.variables === row.id}
            onClick={() => enrichMutation.mutate(row.id)}
          >
            Enrich
          </Button>
        )
      },
    },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">AI Enrichment</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Enrich product data with AI-generated descriptions and specifications</p>
        </div>

        {/* Stats */}
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 space-y-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.total ?? '—'}</p>
              <p className="text-xs text-[#6B7280]">Total Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats?.enriched ?? '—'}</p>
              <p className="text-xs text-[#6B7280]">Enriched</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats?.unenriched ?? '—'}</p>
              <p className="text-xs text-[#6B7280]">Unenriched</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span>Enrichment Progress</span>
              <span>{percentEnriched.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0072CE] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentEnriched, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              loading={batchMutation.isPending}
              onClick={() => batchMutation.mutate()}
            >
              Enrich All Unenriched
            </Button>
            {batchMutation.isSuccess && batchMutation.data && (
              <span className="text-sm text-emerald-600 self-center">
                Queued {batchMutation.data.queued_count} products — {batchMutation.data.note}
              </span>
            )}
            {batchMutation.isError && (
              <span className="text-sm text-[#EF4444] self-center">Batch enrichment failed</span>
            )}
          </div>
        </div>

        {/* Products table */}
        <DataTable
          columns={columns}
          data={products as (Product & Record<string, unknown>)[]}
          loading={productsQuery.isLoading}
          emptyMessage="No products found"
          rowKey={(row) => String(row.id)}
          stickyHeader
        />
      </div>
    </div>
  )
}
