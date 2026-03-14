import { NextResponse } from 'next/server'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://advancedsystems-int.com'
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000'

export const revalidate = 3600

export async function GET() {
  const urls: string[] = []
  let page = 1
  const size = 500
  let hasMore = true

  while (hasMore) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/?page=${page}&size=${size}`, {
        next: { revalidate: 3600 },
      })
      const data = await res.json()
      const items = data?.items || []
      for (const p of items) {
        const pn = p.part_number || p.slug || String(p.id)
        if (pn) urls.push(`${BASE}/part-number/${encodeURIComponent(pn)}`)
      }
      hasMore = items.length >= size
      page++
    } catch {
      hasMore = false
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
