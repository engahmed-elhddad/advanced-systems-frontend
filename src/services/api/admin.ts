import type { ProductListItem } from '@/types/product'
import type { RFQRow } from '@/types/rfq'
import type { ApiResult, PaginatedResponse } from '@/types/api'
import { apiClient } from './client'

/** Public catalog list with admin-oriented defaults (`include_unready`). */
export async function adminListProducts(params: {
  page?: number
  size?: number
  search?: string
  brand_id?: number
  category_id?: number
}): ApiResult<PaginatedResponse<ProductListItem>> {
  return apiClient.get<PaginatedResponse<ProductListItem>>('/api/v1/products/', {
    params: {
      ...params,
      include_unready: true,
    },
  })
}

export async function adminListRFQs(params: {
  page?: number
  size?: number
  status?: string
}): ApiResult<PaginatedResponse<RFQRow>> {
  return apiClient.get<PaginatedResponse<RFQRow>>('/api/v1/admin/rfqs', {
    params: {
      page: params.page,
      size: params.size ?? 20,
      status: params.status,
    },
  })
}

export async function adminUpdateRFQ(
  id: number,
  body: Partial<{
    status: string
    quoted_price_usd: number
    lead_time: string
    admin_notes: string
  }>
): ApiResult<RFQRow> {
  return apiClient.put<RFQRow>(`/api/v1/admin/rfqs/${id}`, body)
}
