import { useQuery } from '@tanstack/react-query'
import * as productService from '@/features/products/services'
import { api } from '@/lib/api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    staleTime: 600_000,
  })
}

/** Category attribute schema rows (admin); used to seed product spec keys. */
export type AdminCategorySchemaEntry = {
  id: number
  attribute_definition_id: number
  sort_order: number
  attribute: { key: string; label: string; data_type?: string }
}

export function useAdminCategorySchema(categoryId: string) {
  const id = Number(categoryId)
  return useQuery({
    queryKey: ['admin-category-schema', id],
    queryFn: async () => {
      const res = await api.get<AdminCategorySchemaEntry[]>(`/api/v1/admin/categories/${id}/schema`)
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 300_000,
  })
}
