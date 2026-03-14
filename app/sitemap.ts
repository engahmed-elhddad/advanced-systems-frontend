import type { MetadataRoute } from "next"
import { CATEGORIES, SITE_URL } from "@/app/lib/constants"

const base = SITE_URL
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"

/** Fetch all part numbers via paginated SEO API (scales to thousands) */
async function fetchAllPartNumbers(): Promise<string[]> {
  const partNumbers: string[] = []
  let page = 1
  let hasMore = true
  const size = 5000
  while (hasMore) {
    try {
      const res = await fetch(`${API_BASE}/api/seo/urls?type=products&page=${page}&size=${size}`, {
        next: { revalidate: 3600 },
      })
      const data = await res.json()
      const items = data?.part_numbers || []
      partNumbers.push(...items)
      hasMore = page < (data?.pages ?? 1)
      page++
    } catch {
      hasMore = false
    }
  }
  return partNumbers
}

/** Fetch brands from SEO API (fallback to v1 brands) */
async function fetchBrands(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/seo/urls?type=brands`, { next: { revalidate: 3600 } })
    const data = await res.json()
    if (data?.brands?.length) return data.brands
  } catch { /* fallback */ }
  try {
    const res = await fetch(`${API_BASE}/api/v1/brands/`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return Array.isArray(data) ? data.map((b: any) => b.slug || b.name) : data?.brands || []
  } catch {
    return []
  }
}

/** Fetch categories from SEO API, merge with CATEGORIES slugs */
async function fetchCategorySlugs(): Promise<string[]> {
  const fromConst = CATEGORIES.map((c) => c.slug)
  const seen = new Set(fromConst.map((s) => s.toLowerCase()))
  try {
    const res = await fetch(`${API_BASE}/api/seo/urls?type=categories`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const cats = data?.categories || []
    for (const c of cats) {
      const slug = (c || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      if (slug && !seen.has(slug)) {
        seen.add(slug)
        fromConst.push(slug)
      }
    }
  } catch { /* ignore */ }
  return fromConst
}

/** Fetch matrix slugs (product_count > 3) */
async function fetchMatrixSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/matrix/slugs?limit=5000`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return data?.slugs || []
  } catch {
    return []
  }
}

/** Fetch news article slugs */
async function fetchNewsSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/news?limit=1000`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return (data?.items || []).map((a: { slug?: string }) => a.slug).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [partNumbers, brands, categorySlugs, matrixSlugs, newsSlugs] = await Promise.all([
    fetchAllPartNumbers(),
    fetchBrands(),
    fetchCategorySlugs(),
    fetchMatrixSlugs(),
    fetchNewsSlugs(),
  ])

  const partNumberPages = partNumbers.map((pn) => ({
    url: `${base}/part-number/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const productPages = partNumbers.map((pn) => ({
    url: `${base}/product/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }))

  const availabilityPages = partNumbers.map((pn) => ({
    url: `${base}/availability/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const obsoletePages = partNumbers.map((pn) => ({
    url: `${base}/obsolete/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const datasheetPages = partNumbers.map((pn) => ({
    url: `${base}/datasheet/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const alternativesPages = partNumbers.map((pn) => ({
    url: `${base}/alternatives/${encodeURIComponent(pn)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const toBrandSlug = (b: string | { slug?: string; name?: string }) =>
    (typeof b === "string" ? b : (b as any)?.slug || (b as any)?.name || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
  const brandPages = brands
    .map((b) => ({
      url: `${base}/brand/${encodeURIComponent(toBrandSlug(b))}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
    .filter((e) => e.url && e.url !== `${base}/brand/`)

  const categoryPages = categorySlugs.map((slug) => ({
    url: `${base}/category/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const matrixPages = matrixSlugs.flatMap((slug) => [
    { url: `${base}/en/${encodeURIComponent(slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
    { url: `${base}/ar/${encodeURIComponent(slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
  ])

  const newsArticlePages = newsSlugs.flatMap((slug) => [
    { url: `${base}/en/news/${encodeURIComponent(slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/ar/news/${encodeURIComponent(slug)}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ])

/* =========================
STATIC PAGES
========================= */

const staticPages = [
  { url: `${base}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
  { url: `${base}/products`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
  { url: `${base}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
  { url: `${base}/product-finder`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.85 },
  { url: `${base}/tools`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/en`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.95 },
  { url: `${base}/ar`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.95 },
  { url: `${base}/en/news`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
  { url: `${base}/ar/news`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
  { url: `${base}/tools/scan-component`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
  { url: `${base}/tools/bom-upload`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.75 },
  { url: `${base}/panel-builder`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.85 },
  { url: `${base}/ai-assistant`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
  { url: `${base}/knowledge`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.85 },
  { url: `${base}/knowledge/guides`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/knowledge/datasheet-library`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/knowledge/calculators`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/knowledge/glossary`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/knowledge/troubleshooting`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/rfq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  { url: `${base}/rfq/instant`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  { url: `${base}/rfq/dashboard`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
  { url: `${base}/categories`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/brands`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
]



/* =========================
FINAL SITEMAP
========================= */

return [
  ...staticPages,
  ...brandPages,
  ...categoryPages,
  ...matrixPages,
  ...newsArticlePages,
  ...partNumberPages,
  ...productPages,
  ...datasheetPages,
  ...alternativesPages,
  ...availabilityPages,
  ...obsoletePages,
]

}