'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  approveQuotation,
  createQuotation,
  getB2BCustomers,
  getQuotationById,
  getQuotations,
  rejectQuotation,
  sendQuotation,
  updateQuotation,
  type CreateQuotationPayload,
  type QuotationDetail,
  type QuotationListItem,
  type UpdateQuotationPayload,
} from '@/features/admin/services/adminService'
import { getProducts } from '@/features/products/services'

export type QuotationStatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'rejected'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

const QUOTATION_LIST_PAGE_SIZE = 50

export function useQuotationsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<QuotationStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [quotationListPage, setQuotationListPage] = useState(1)
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  const searchNorm = normalize(search)

  useEffect(() => {
    setQuotationListPage(1)
  }, [statusFilter, search])

  const quotationsQuery = useQuery({
    queryKey: ['quotations', 'list', statusFilter, quotationListPage, searchNorm],
    queryFn: () => {
      const st = statusFilter === 'all' ? undefined : statusFilter
      if (searchNorm) {
        return getQuotations({ status: st, page: 1, per_page: 200 })
      }
      return getQuotations({ status: st, page: quotationListPage, per_page: QUOTATION_LIST_PAGE_SIZE })
    },
    staleTime: 20_000,
  })

  const customersQuery = useQuery({
    queryKey: ['b2b-customers'],
    queryFn: getB2BCustomers,
    staleTime: 120_000,
  })

  const productsQuery = useQuery({
    queryKey: ['quotation-products'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, size: 200 })
      return res.items
    },
    staleTime: 120_000,
  })

  const quotationDetailQuery = useQuery({
    queryKey: ['quotation-detail', selectedQuotationId],
    queryFn: () => getQuotationById(selectedQuotationId as number),
    enabled: selectedQuotationId !== null,
    staleTime: 10_000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateQuotationPayload) => createQuotation(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['quotations', 'list'] })
      queryClient.setQueryData(['quotation-detail', created.id], created)
      setSelectedQuotationId(created.id)
      setCreatingNew(false)
    },
    onError: () => toast.error('Could not create quotation. Please try again.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateQuotationPayload }) =>
      updateQuotation(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['quotation-detail', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['quotations', 'list'] })
    },
    onError: () => toast.error('Could not save quotation. Please try again.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'send' | 'approve' | 'reject' }) => {
      if (action === 'send') return sendQuotation(id)
      if (action === 'approve') return approveQuotation(id)
      return rejectQuotation(id)
    },
    onMutate: async ({ id, action }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['quotation-detail', id] }),
        queryClient.cancelQueries({ queryKey: ['quotations', 'list'] }),
      ])

      const targetStatus: QuotationDetail['status'] =
        action === 'send' ? 'sent' : action === 'approve' ? 'approved' : 'rejected'

      const detailSnapshot = queryClient.getQueryData<QuotationDetail>(['quotation-detail', id])
      const listSnapshots = queryClient.getQueriesData<{ items: QuotationListItem[]; total: number }>({
        queryKey: ['quotations', 'list'],
      })

      if (detailSnapshot) {
        queryClient.setQueryData<QuotationDetail>(['quotation-detail', id], {
          ...detailSnapshot,
          status: targetStatus,
        })
      }

      listSnapshots.forEach(([key, data]) => {
        if (!data?.items) return
        queryClient.setQueryData<{ items: QuotationListItem[]; total: number }>(key, {
          ...data,
          items: data.items.map((q) => (q.id === id ? { ...q, status: targetStatus } : q)),
        })
      })

      return { id, detailSnapshot, listSnapshots }
    },
    onError: (_error, _vars, ctx) => {
      if (!ctx) return
      queryClient.setQueryData(['quotation-detail', ctx.id], ctx.detailSnapshot)
      ctx.listSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Quotation status action failed. Please try again.')
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['quotation-detail', updated.id], updated)
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotation-detail', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['quotations', 'list'] })
    },
  })

  const quotations = quotationsQuery.data?.items ?? []
  const q = normalize(search)
  const filteredQuotations = useMemo(() => {
    return quotations.filter((row) => {
      const statusOk = statusFilter === 'all' || normalize(row.status) === statusFilter
      if (!statusOk) return false
      if (!q) return true
      const idHit = String(row.id).includes(q)
      const customerHit = normalize(row.customer_name ?? '').includes(q)
      return idHit || customerHit
    })
  }, [quotations, statusFilter, q])

  const hasNextQuotationPage = !searchNorm && quotations.length >= QUOTATION_LIST_PAGE_SIZE
  const hasPrevQuotationPage = !searchNorm && quotationListPage > 1

  return {
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
    quotations: filteredQuotations,
    quotationsLoading: quotationsQuery.isLoading,
    quotationsError: quotationsQuery.isError,
    selectedQuotation: quotationDetailQuery.data ?? null,
    selectedLoading: quotationDetailQuery.isLoading,
    customers: customersQuery.data ?? [],
    customersLoading: customersQuery.isLoading,
    products: productsQuery.data ?? [],
    productsLoading: productsQuery.isLoading,
    createMutation,
    updateMutation,
    statusMutation,
    refresh: quotationsQuery.refetch,
  }
}

