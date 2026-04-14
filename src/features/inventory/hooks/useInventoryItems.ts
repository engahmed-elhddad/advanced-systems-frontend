import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type InventoryItemRow = {
  id: number
  product_id: number
  offer_id: number | null
  condition: string
  packaging: string
  price: number | null
  status: string
  condition_note: string | null
  created_at?: string | null
}

export type InventoryItemCreateInput = {
  condition: string
  packaging: string
  price?: number | null
  status?: string
  condition_note?: string | null
  offer_id?: number | null
}

export type InventoryItemUpdateInput = Partial<InventoryItemCreateInput>

export function useInventoryItems(
  productId: number,
  filters?: { condition?: string; status?: string; search?: string }
) {
  const q = new URLSearchParams()
  if (filters?.condition) q.set('condition', filters.condition)
  if (filters?.status) q.set('status', filters.status)
  if (filters?.search?.trim()) q.set('search', filters.search.trim())
  const qs = q.toString()
  return useQuery({
    queryKey: ['inventory-items', productId, filters?.condition, filters?.status, filters?.search],
    queryFn: async () => {
      const { data } = await api.get<InventoryItemRow[]>(
        `/api/v1/admin/products/${productId}/inventory-items${qs ? `?${qs}` : ''}`
      )
      return Array.isArray(data) ? data : []
    },
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 15_000,
  })
}

export function useCreateInventoryItem(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InventoryItemCreateInput) =>
      api.post<InventoryItemRow>(`/api/v1/admin/products/${productId}/inventory-items`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['admin-product', productId] })
    },
  })
}

export function useUpdateInventoryItem(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: InventoryItemUpdateInput }) =>
      api.patch<InventoryItemRow>(`/api/v1/admin/inventory-items/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })
}

export function useDeleteInventoryItem(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/admin/inventory-items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })
}

export function useBulkInventoryStatus(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { item_ids: number[]; status: string }) =>
      api.post<{ updated: number }>('/api/v1/admin/inventory-items/bulk-status', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items', productId] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })
}

export async function importInventoryCsv(file: File): Promise<{ created: number; failed_count: number; errors: unknown[] }> {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post<{ created: number; failed_count: number; errors: unknown[] }>(
    '/api/v1/admin/inventory-items/import',
    fd
  )
  return data
}
