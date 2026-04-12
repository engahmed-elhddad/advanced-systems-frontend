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
