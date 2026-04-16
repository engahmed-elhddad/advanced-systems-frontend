import { NextResponse } from 'next/server'
import { API_BASE_URL, SITE_URL } from '@/lib/constants'

const BASE = SITE_URL.replace(/\/$/, '')

export const revalidate = 3600

/** All catalog product URLs (slug-first), same source as main sitemap PDP list. */
async function fetchAllProductUrls(): Promise<string[]> {
  const segments: string[] = []
  let page = 1
  let pagesTotal = 1
  const size = 100
  while (page <= pagesTotal && page <= 5000) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: 'newest',
      })
      const res = await fetch(`${API_BASE_URL}/api/v1/products/?${params}`, {
        next: { revalidate: 3600 },
      })
      if (!res.ok) break
      const data = await res.json()
      const items = data?.items ?? data?.products ?? []
      if (typeof data?.pages === 'number' && data.pages >= 1) pagesTotal = data.pages
      for (const p of items) {
        const slug = String(p.slug ?? '').trim()
        const pn = String(p.part_number ?? '').trim()
        const seg = slug || pn
        if (seg) segments.push(`${BASE}/products/${encodeURIComponent(seg)}`)
      }
      if (!items.length) break
      page += 1
    } catch {
      break
    }
  }
  return [...new Set(segments)]
}

export async function GET() {
  const urls = await fetchAllProductUrls()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
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
