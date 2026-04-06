import { api } from '@/lib/api'
import type { RFQCreateInput, RFQResponse, RFQDetail, RFQListResponse } from '@/types/rfq'

export async function submitRFQ(data: RFQCreateInput): Promise<RFQResponse> {
  const res = await api.post<RFQResponse>('/api/v1/rfq/', data)
  return res.data
}

export interface BatchRFQInput {
  email: string
  company?: string
  items: Array<{ part_number: string; quantity: number }>
}

export interface BatchRFQResult {
  references: string[]
  email: string
  count: number
}

export async function submitBatchRFQ(data: BatchRFQInput): Promise<BatchRFQResult> {
  const results = await Promise.all(
    data.items.map((item) =>
      submitRFQ({
        part_number: item.part_number,
        quantity: item.quantity,
        email: data.email,
        company: data.company,
        message: data.items.length > 1
          ? `Multi-part RFQ (${data.items.length} items)`
          : undefined,
      }),
    ),
  )
  return {
    references: results.map((r) => r.reference),
    email: data.email,
    count: results.length,
  }
}

export async function getMyRFQs(email: string): Promise<RFQListResponse> {
  const res = await api.get<RFQListResponse>('/api/v1/rfq/', {
    params: { email: email.trim().toLowerCase() },
  })
  return res.data
}

export async function getRFQByReference(ref: string): Promise<RFQDetail> {
  const res = await api.get<RFQDetail>(`/api/v1/rfq/${encodeURIComponent(ref)}`)
  return res.data
}
