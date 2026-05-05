/**
 * Canonical company profile (EN/AR) — use on footer, about, contact, RFQ trust, and schema.
 */

export const COMPANY_NAME_EN = 'Advanced Systems for Electrical Supplies'
export const COMPANY_NAME_AR = 'الأنظمة المتقدمة للتوريدات الكهربائية'

export const COMPANY_BRAND_SHORT = 'Advanced Systems'

export const COMPANY_DESCRIPTION =
  'We provide industrial automation solutions and electrical supplies, offering both in-stock components and global sourcing for hard-to-find parts. We support factories and industrial clients with fast response and reliable sourcing.'

export const COMPANY_LOCATION_LINES = [
  '10th of Ramadan City, Jordanian District',
  'Al-Ezz Commercial Buildings, Building A, Shop 10',
  'Egypt',
] as const

export const COMPANY_LOCATION_SINGLE_LINE = COMPANY_LOCATION_LINES.join(', ')

export const COMPANY_BUSINESS_MODEL = [
  'In-stock products',
  'Local & international sourcing',
  'Licensed importer',
] as const

export const COMPANY_BRANDS = [
  'Siemens',
  'ABB',
  'Schneider',
  'KEB',
  'Allen-Bradley',
  'Danfoss',
  'Vacon',
  'IFM',
  'WAGO',
  'Yokogawa',
  'Pilz',
  'Parker',
  'Emerson',
  'Control Techniques',
  'Lenze',
  'Endress+Hauser',
  'Vega',
  'Rosemount',
  'Nidec',
  'WIKA',
  'Eaton',
  'Omron',
  'Yaskawa',
  'Mitsubishi',
] as const

/** Subset for compact UI (trust strips, footers). */
export const COMPANY_BRANDS_STRIP: readonly string[] = COMPANY_BRANDS.slice(0, 8)

export const COMPANY_TRUST_STATEMENTS = [
  'Registered business in Egypt',
  'Tax ID available upon request',
] as const

/** Site-wide seller warranty (months) — FR-002. */
export const WARRANTY_MONTHS = 12

/** Site-wide RMA window (days) — FR-003. */
export const RMA_WINDOW_DAYS = 30

/** Active ISO certifications; empty in v1 — FR-005. */
export const ISO_CERTIFICATIONS: Array<{ name: string; year?: number }> = []

export const WARRANTY_BADGE_EN = '12 months warranty'
export const WARRANTY_BADGE_AR = 'ضمان 12 شهرًا'

export const RMA_BADGE_EN = '30-day return policy'
export const RMA_BADGE_AR = 'إرجاع خلال 30 يومًا'

export const ISO_LABEL_EN = 'Certified'
export const ISO_LABEL_AR = 'معتمد'

export const CONTACT_LABEL_WHATSAPP_EN = 'WhatsApp us'
export const CONTACT_LABEL_WHATSAPP_AR = 'تواصل عبر واتساب'

export const CONTACT_LABEL_EMAIL_EN = 'Email'
export const CONTACT_LABEL_EMAIL_AR = 'البريد الإلكتروني'

export const CONTACT_LABEL_PHONE_EN = 'Call'
export const CONTACT_LABEL_PHONE_AR = 'اتصال'

export const WHATSAPP_INQUIRY_TEMPLATE_EN = 'Inquiry about {part_number}'
export const WHATSAPP_INQUIRY_TEMPLATE_AR = 'استفسار عن {part_number}'

/** Stock badges on PDP / cards (spec 017). */
export const STOCK_BADGE_LABELS_EN = {
  in_stock_prefix: 'In Stock',
  lead_time_7: '7-day',
  lead_time_14: '14-day',
  indent: 'Indent',
} as const

export const STOCK_BADGE_LABELS_AR = {
  in_stock_prefix: 'متوفر في',
  lead_time_7: '٧ أيام',
  lead_time_14: '١٤ يومًا',
  indent: 'تحت الطلب',
} as const

export const WAREHOUSE_PRIORITY = ['EG', 'EU'] as const
