/** Spec 014 — search toolbar sort + page size (URL-bound). */

export type SortIdentifier =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'brand_az'
  | 'partnumber_az'
  | 'newest'
  | 'popular'

export const SORT_DROPDOWN_OPTIONS: ReadonlyArray<{
  value: Exclude<SortIdentifier, 'newest' | 'popular'>
  label: string
}> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'brand_az', label: 'Brand A–Z' },
  { value: 'partnumber_az', label: 'Part Number A–Z' },
]

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export const DEFAULT_PAGE_SIZE: PageSize = 20
