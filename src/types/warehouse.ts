export type StockBadge =
  | { kind: 'in_stock'; warehouse_id: number; name_en: string; name_ar: string }
  | { kind: 'lead_time'; days: 7 | 14 }
  | { kind: 'indent' }

export interface Warehouse {
  id: number
  code: string
  name_en: string
  name_ar: string
  country_code: string
  default_hs_code: string | null
  default_lead_time_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseCreatePayload {
  code: string
  name_en: string
  name_ar: string
  country_code: string
  default_hs_code?: string
  default_lead_time_days?: number
}

export interface WarehouseUpdatePayload {
  name_en?: string
  name_ar?: string
  country_code?: string
  default_hs_code?: string | null
  default_lead_time_days?: number | null
  is_active?: boolean
}
