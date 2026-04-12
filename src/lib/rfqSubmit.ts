import type { RFQCreateInput, RFQResponse } from '@/types/rfq'
import { API_BASE_URL } from '@/lib/constants'
import { getRfqAttributionPayload } from '@/lib/visitor-context'

function submitUrl(): string {
  return typeof window !== 'undefined' ? '/api/rfq' : `${API_BASE_URL}/api/v1/rfq/`
}

export async function submitPublicRFQ(body: RFQCreateInput): Promise<RFQResponse> {
  const attribution = typeof window !== 'undefined' ? getRfqAttributionPayload() : {}
  const res = await fetch(submitUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ...attribution }),
  })
  const data = (await res.json().catch(() => ({}))) as { detail?: unknown }
  if (!res.ok) {
    const d = data?.detail
    let msg = 'RFQ submission failed'
    if (typeof d === 'string' && d.trim()) msg = d
    else if (Array.isArray(d) && d.length && typeof d[0] === 'object' && d[0] && 'msg' in d[0]) {
      msg = String((d[0] as { msg?: string }).msg || msg)
    }
    throw new Error(msg)
  }
  return data as RFQResponse
}
