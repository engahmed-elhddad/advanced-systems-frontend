import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type ProductOfferRow = {
  id: number
  condition: string
  packaging: string
  price: number | null
  quantity: number
  condition_notes: string | null
  currency: string | null
  availability: string | null
  is_active: boolean
  display_label: string | null
}

export type ProductOfferCreateInput = {
  condition: string
  packaging: string
  price?: number | null
  quantity?: number
  condition_notes?: string | null
  is_active?: boolean
}

export type ProductOfferUpdateInput = Partial<ProductOfferCreateInput>

export function useProductOffers(productId: number) {
  return useQuery({
    queryKey: ['product-offers', productId],
    queryFn: async () => {
      const { data } = await api.get<ProductOfferRow[]>(
        `/api/v1/admin/products/${productId}/offers`
      )
      return Array.isArray(data) ? data : []
    },
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 15_000,
  })
}

export function useCreateProductOffer(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProductOfferCreateInput) =>
      api
        .post<ProductOfferRow>(`/api/v1/admin/products/${productId}/offers`, body)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-offers', productId] })
    },
  })
}

export function useUpdateProductOffer(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ offerId, body }: { offerId: number; body: ProductOfferUpdateInput }) =>
      api
        .patch<ProductOfferRow>(`/api/v1/admin/products/${productId}/offers/${offerId}`, body)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-offers', productId] })
    },
  })
}

export function useDeleteProductOffer(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (offerId: number) =>
      api.delete(`/api/v1/admin/products/${productId}/offers/${offerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-offers', productId] })
    },
  })
}
