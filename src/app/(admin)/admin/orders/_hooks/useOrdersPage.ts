'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOrderNote,
  getOrderById,
  getOrderNotes,
  getOrders,
  getOrderTimeline,
  setOrderStatus,
  type B2BOrderStatus,
  type OrderNote,
  type OrdersListItem,
} from '@/services/adminService'

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export function useOrdersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const ordersQuery = useQuery({
    queryKey: ['orders', { statusFilter }],
    queryFn: () =>
      getOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        per_page: 100,
      }),
    staleTime: 30_000,
  })

  const detailQuery = useQuery({
    queryKey: ['order-detail', selectedOrderId],
    queryFn: () => getOrderById(selectedOrderId as number),
    enabled: selectedOrderId !== null,
    staleTime: 10_000,
  })

  const timelineQuery = useQuery({
    queryKey: ['order-timeline', selectedOrderId],
    queryFn: () => getOrderTimeline(selectedOrderId as number),
    enabled: selectedOrderId !== null,
  })

  const notesQuery = useQuery({
    queryKey: ['order-notes', selectedOrderId],
    queryFn: () => getOrderNotes(selectedOrderId as number),
    enabled: selectedOrderId !== null,
  })

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: B2BOrderStatus }) =>
      setOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['orders'] }),
        queryClient.cancelQueries({ queryKey: ['order-detail', orderId] }),
      ])

      const ordersSnapshots = queryClient.getQueriesData<{ items: OrdersListItem[]; total: number }>({
        queryKey: ['orders'],
      })
      const detailSnapshot = queryClient.getQueryData(['order-detail', orderId])

      ordersSnapshots.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<{ items: OrdersListItem[]; total: number }>(key, {
          ...data,
          items: data.items.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                }
              : o,
          ),
        })
      })

      queryClient.setQueryData(['order-detail', orderId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        return {
          ...(old as Record<string, unknown>),
          status,
        }
      })

      return { ordersSnapshots, detailSnapshot, orderId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      ctx.ordersSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      queryClient.setQueryData(['order-detail', ctx.orderId], ctx.detailSnapshot)
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-detail', vars.orderId] })
      queryClient.invalidateQueries({ queryKey: ['order-timeline', vars.orderId] })
    },
  })

  const notesMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      addOrderNote(orderId, { note }),
    onMutate: async ({ orderId, note }) => {
      await queryClient.cancelQueries({ queryKey: ['order-notes', orderId] })
      const snapshot = queryClient.getQueryData<OrderNote[]>(['order-notes', orderId])
      const optimistic: OrderNote = {
        id: -Date.now(),
        note,
        created_by: 'You',
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<OrderNote[]>(['order-notes', orderId], (old) => [optimistic, ...(old ?? [])])
      return { snapshot, orderId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      queryClient.setQueryData(['order-notes', ctx.orderId], ctx.snapshot)
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', vars.orderId] })
    },
  })

  const selectedOrder = detailQuery.data
  const orders = ordersQuery.data?.items ?? []

  const selectedOrderFromList = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  return {
    statusFilter,
    setStatusFilter,
    selectedOrderId,
    setSelectedOrderId,
    orders,
    ordersLoading: ordersQuery.isLoading,
    ordersError: ordersQuery.isError,
    selectedOrder,
    selectedOrderFromList,
    detailLoading: detailQuery.isLoading,
    timeline: timelineQuery.data ?? [],
    timelineLoading: timelineQuery.isLoading,
    notes: notesQuery.data ?? [],
    notesLoading: notesQuery.isLoading,
    statusMutation,
    notesMutation,
    refresh: ordersQuery.refetch,
  }
}

