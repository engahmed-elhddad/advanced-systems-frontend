import { NextResponse } from 'next/server'
import { API_BASE_URL, SITE_URL } from '@/lib/constants'

const BASE = SITE_URL.replace(/\/$/, '')

export const revalidate = 3600

async function fetchAllBrandUrls(): Promise<string[]> {
  const locs: string[] = []
  let page = 1
  let pagesTotal = 1
  const size = 5000
  while (page <= pagesTotal && page <= 5000) {
    const params = new URLSearchParams({
      type: 'brands',
      page: String(page),
      size: String(size),
    })
    const res = await fetch(`${API_BASE_URL}/api/seo/urls?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) break
    const data = (await res.json()) as { pages?: number; brands?: string[] }
    if (typeof data.pages === 'number' && data.pages >= 1) pagesTotal = data.pages
    const rows = data.brands ?? []
    for (const slug of rows) {
      const s = String(slug ?? '').trim()
      if (s) locs.push(`${BASE}/brands/${encodeURIComponent(s)}`)
    }
    if (!rows.length) break
    page += 1
  }
  return [...new Set(locs)]
}

export async function GET() {
  const urls = await fetchAllBrandUrls()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
