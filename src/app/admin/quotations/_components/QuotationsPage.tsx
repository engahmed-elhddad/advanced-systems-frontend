'use client'

import { RefreshCw } from 'lucide-react'
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
          <h1 className="text-xl font-bold text-[#1A1A1A]">Quotation Management</h1>
          <p className="text-sm text-[#6B7280]">
            Draft-based hybrid quotations with inline editing and auto-save
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {quotationsError ? (
        <div className="rounded-[4px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load quotations.
        </div>
      ) : null}

      {!quotationsError && !search.trim() && (hasPrevQuotationPage || hasNextQuotationPage) ? (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[#6B7280]">
          <span className="font-mono">Page {quotationListPage}</span>
          <button
            type="button"
            disabled={!hasPrevQuotationPage || quotationsLoading}
            onClick={() => setQuotationListPage((p: number) => Math.max(1, p - 1))}
            className="rounded-[2px] border border-[#E5E7EB] bg-white px-2 py-1 font-medium text-[#1A1A1A] disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!hasNextQuotationPage || quotationsLoading}
            onClick={() => setQuotationListPage((p: number) => p + 1)}
            className="rounded-[2px] border border-[#E5E7EB] bg-white px-2 py-1 font-medium text-[#1A1A1A] disabled:opacity-40"
          >
            Next
          </button>
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

