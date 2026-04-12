export type RFQStatus = 'pending' | 'in_progress' | 'quoted' | 'closed' | 'cancelled'

export interface RFQCreateInput {
  part_number: string
  quantity: number
  email: string
  company?: string
  message?: string
  contact_name?: string
  country?: string
  phone?: string
  product_id?: number
  /** Set automatically by submitPublicRFQ when analytics consent is accepted */
  visitor_id?: string
  utm_source?: string
}

export interface RFQResponse {
  id: number
  reference: string
  status: RFQStatus | string
  part_number: string
  quantity: number
  email: string
  company?: string
  created_at: string
}

export interface RFQDetail extends RFQResponse {
  quoted_price_usd?: number | null
  lead_time?: string | null
  admin_notes?: string | null
  message?: string | null
  contact_name?: string | null
  country?: string | null
  phone?: string | null
  updated_at?: string | null
}

export interface RFQListResponse {
  rfqs: RFQDetail[]
  total: number
  page?: number
  size?: number
}

export interface RFQUpdateInput {
  status?: string
  quoted_price_usd?: number
  lead_time?: string
  admin_notes?: string
}

/** Alias for backward compat with features/ layer */
export type RFQRow = RFQDetail
export type RFQCreatePayload = RFQCreateInput
