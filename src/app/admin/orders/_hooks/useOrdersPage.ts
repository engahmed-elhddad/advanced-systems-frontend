'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  cancelB2BOrder,
  confirmB2BOrder,
  deliverB2BOrder,
  getOrderById,
  getOrders,
  type B2BOrderStatus,
  type OrdersListItem,
} from '@/features/admin/services/adminService'

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export type OrderAction = 'confirmed' | 'cancelled' | 'delivered'

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

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: number; action: OrderAction }) => {
      if (action === 'confirmed') return confirmB2BOrder(orderId)
      if (action === 'cancelled') return cancelB2BOrder(orderId)
      return deliverB2BOrder(orderId)
    },
    onMutate: async ({ orderId, action }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['orders'] }),
        queryClient.cancelQueries({ queryKey: ['order-detail', orderId] }),
      ])

      const statusMap: Record<OrderAction, B2BOrderStatus> = {
        confirmed: 'confirmed',
        cancelled: 'cancelled',
        delivered: 'delivered',
      }
      const nextStatus = statusMap[action]

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
                  status: nextStatus,
                }
              : o,
          ),
        })
      })

      queryClient.setQueryData(['order-detail', orderId], (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        return {
          ...(old as Record<string, unknown>),
          status: nextStatus,
        }
      })

      return { ordersSnapshots, detailSnapshot, orderId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      ctx.ordersSnapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      queryClient.setQueryData(['order-detail', ctx.orderId], ctx.detailSnapshot)
      toast.error('Order status update failed. Please try again.')
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-detail', vars.orderId] })
    },
  })

  const selectedOrder = detailQuery.data
  const orders = ordersQuery.data?.items ?? []

  return {
    statusFilter,
    setStatusFilter,
    selectedOrderId,
    setSelectedOrderId,
    orders,
    ordersLoading: ordersQuery.isLoading,
    ordersError: ordersQuery.isError,
    selectedOrder,
    detailLoading: detailQuery.isLoading,
    statusMutation,
    refresh: ordersQuery.refetch,
  }
}
