import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/app/lib/constants'

const STATIC_PAGES = [
  { path: '/', changeFrequency: 'daily' as const, priority: 1.0 },
  { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/brands', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/rfq', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/rfq/instant', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/search', changeFrequency: 'daily' as const, priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/knowledge', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/knowledge/guides', changeFrequency: 'weekly' as const, priority: 0.6 },
  { path: '/knowledge/glossary', changeFrequency: 'weekly' as const, priority: 0.5 },
  { path: '/knowledge/calculators', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/knowledge/troubleshooting', changeFrequency: 'weekly' as const, priority: 0.5 },
  { path: '/knowledge/datasheet-library', changeFrequency: 'weekly' as const, priority: 0.5 },
  { path: '/tools', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/product-finder', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/suppliers', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/emergency-industrial-spare-parts', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/siemens-micromaster-440', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/abb-acs550-drive', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/siemens-g120-drive', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/schneider-atv71-drive', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/powerflex-700-drive', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/knowledge/guides/micromaster-440-egypt', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/knowledge/guides/abb-vs-siemens-vfd', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/knowledge/guides/best-industrial-vfd', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/knowledge/guides/obsolete-parts-egypt', changeFrequency: 'weekly' as const, priority: 0.7 },
  { path: '/knowledge/guides/emergency-plc-failure', changeFrequency: 'weekly' as const, priority: 0.7 },
]

type ProductRow = { part_number?: string }
type BrandRow = { slug?: string; name?: string }
type CategoryRow = { slug?: string; name?: string }

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
    const res = await fetch(`${apiBase}${url}`, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

async function fetchProductPartNumbers(): Promise<string[]> {
  const partNumbers: string[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages && page <= 500) {
    const data = await safeFetch<{ items?: ProductRow[]; products?: ProductRow[]; total?: number; pages?: number }>(
      `/api/v1/products?page=${page}&size=100`,
      { items: [] },
    )
    const rows = data.items ?? data.products ?? []
    if (!rows.length) break
    for (const row of rows) {
      const pn = (row.part_number || '').trim()
      if (pn) partNumbers.push(pn)
    }
    totalPages = data.pages ?? (Math.ceil((data.total || 0) / 100) || 1)
    page += 1
  }
  return [...new Set(partNumbers)]
}

async function fetchBrandSlugs(): Promise<string[]> {
  const data = await safeFetch<{ brands?: BrandRow[] } | BrandRow[]>('/api/v1/brands', [])
  const rows = Array.isArray(data) ? data : (data.brands ?? [])
  return [...new Set(
    rows
      .map((r) => (typeof r === 'string' ? slugify(r) : r.slug || slugify(r.name || '')))
      .filter(Boolean),
  )]
}

async function fetchCategorySlugs(): Promise<string[]> {
  const data = await safeFetch<{ categories?: CategoryRow[] } | CategoryRow[]>('/api/v1/categories', [])
  const rows = Array.isArray(data) ? data : (data.categories ?? [])
  return [...new Set(
    rows
      .map((r) => (typeof r === 'string' ? slugify(r) : r.slug || slugify(r.name || '')))
      .filter(Boolean),
  )]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  let productParts: string[] = []
  let brandSlugs: string[] = []
  let categorySlugs: string[] = []

  try {
    ;[productParts, brandSlugs, categorySlugs] = await Promise.all([
      fetchProductPartNumbers(),
      fetchBrandSlugs(),
      fetchCategorySlugs(),
    ])
  } catch {
    return staticEntries
  }

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...brandSlugs.map((slug) => ({
      url: `${SITE_URL}/brands/${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...categorySlugs.map((slug) => ({
      url: `${SITE_URL}/categories/${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...productParts.map((pn) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(pn)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]

  const seen = new Set<string>()
  return [...staticEntries, ...dynamicEntries].filter((entry) => {
    if (seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  })
}
