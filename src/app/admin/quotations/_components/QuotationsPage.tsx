'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { QuotationList } from './QuotationList'
import { QuotationBuilder } from './QuotationBuilder'
import { useQuotationsPage } from '../_hooks/useQuotationsPage'

export function QuotationsPage() {
  const {
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    quotationListPage,
    setQuotationListPage,
    hasNextQuotationPage,
    hasPrevQuotationPage,
    selectedQuotationId,
    setSelectedQuotationId,
    creatingNew,
    setCreatingNew,
    quotations,
    quotationsLoading,
    quotationsError,
    selectedQuotation,
    selectedLoading,
    customers,
    products,
    createMutation,
    updateMutation,
    statusMutation,
    refresh,
  } = useQuotationsPage()

  const mutationBusy =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Quotation Management</h1>
          <p className="text-sm text-white/50">
            Draft-based hybrid quotations with inline editing and auto-save
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {quotationsError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load quotations.
        </div>
      ) : null}

      {!quotationsError && !search.trim() && (hasPrevQuotationPage || hasNextQuotationPage) ? (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-white/50">
          <span className="font-mono">Page {quotationListPage}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPrevQuotationPage || quotationsLoading}
            onClick={() => setQuotationListPage((p: number) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNextQuotationPage || quotationsLoading}
            onClick={() => setQuotationListPage((p: number) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <QuotationList
          quotations={quotations}
          loading={quotationsLoading}
          statusFilter={statusFilter}
          search={search}
          selectedId={selectedQuotationId}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearch}
          onSelect={(id) => {
            setCreatingNew(false)
            setSelectedQuotationId(id)
          }}
          onCreate={() => {
            setCreatingNew(true)
            setSelectedQuotationId(null)
          }}
        />

        <QuotationBuilder
          quotation={selectedQuotation}
          creatingNew={creatingNew}
          customers={customers}
          products={products}
          loading={selectedLoading && !creatingNew}
          busy={mutationBusy}
          onCreate={(payload) => createMutation.mutate(payload)}
          onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
          onAction={(id, action) => statusMutation.mutate({ id, action })}
        />
      </div>
    </div>
  )
}
