import { api } from '@/lib/api'
import { submitPublicRFQ } from '@/lib/rfqSubmit'
import type { RFQCreateInput, RFQResponse, RFQDetail, RFQListResponse } from '@/types/rfq'

export async function submitRFQ(data: RFQCreateInput): Promise<RFQResponse> {
  return submitPublicRFQ(data)
}

export interface BatchRFQInput {
  email: string
  company?: string
  contact_name?: string
  country?: string
  phone?: string
  message?: string
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
        contact_name: data.contact_name,
        country: data.country,
        phone: data.phone,
        message:
          data.items.length > 1
            ? [data.message?.trim(), `Multi-part RFQ (${data.items.length} lines)`].filter(Boolean).join('\n\n') ||
              `Multi-part RFQ (${data.items.length} lines)`
            : data.message,
      }),
    ),
  )
  return {
    references: results.map((r) => r.reference),
    email: data.email,
    count: results.length,
  }
}

export async function getMyRFQs(
  email: string,
  opts?: { limit?: number; reference?: string },
): Promise<RFQListResponse> {
  const params: Record<string, string | number> = {
    email: email.trim().toLowerCase(),
  }
  if (opts?.limit != null) params.limit = opts.limit
  if (opts?.reference?.trim()) params.reference = opts.reference.trim()
  const res = await api.get<RFQListResponse>('/api/v1/rfq/', { params })
  return res.data
}

export async function getRFQByReference(ref: string): Promise<RFQDetail> {
  const res = await api.get<RFQDetail>(`/api/v1/rfq/${encodeURIComponent(ref)}`)
  return res.data
}
