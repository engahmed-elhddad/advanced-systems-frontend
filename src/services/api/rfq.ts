import type { ApiResult, PaginatedResponse } from '@/types/api'
import type { RFQCreatePayload, RFQRow } from '@/types/rfq'
import { apiClient } from './client'

export async function submitRFQ(
  data: RFQCreatePayload
): ApiResult<RFQRow> {
  return apiClient.post<RFQRow>('/api/v1/rfq/', data)
}

/** Admin-authenticated list (matches `GET /api/v1/admin/rfqs`). */
export async function getRFQList(params: {
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

export async function getRFQByReference(reference: string): ApiResult<RFQRow> {
  return apiClient.get<RFQRow>(
    `/api/v1/rfq/${encodeURIComponent(reference)}`
  )
}

export const getRFQs = getRFQList
export const getRFQ = getRFQByReference
