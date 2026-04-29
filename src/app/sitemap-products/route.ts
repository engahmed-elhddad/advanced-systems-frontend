import { NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/constants'
import { canonicalPath } from '@/lib/seo'

export const revalidate = 3600

type SeoType = 'products' | 'brands' | 'categories'

async function fetchAllSeoLocs(type: SeoType, buildLoc: (segment: string) => string): Promise<string[]> {
  const locs: string[] = []
  let page = 1
  let pagesTotal = 1
  const size = 5000
  while (page <= pagesTotal && page <= 5000) {
    const params = new URLSearchParams({
      type,
      page: String(page),
      size: String(size),
    })
    const res = await fetch(`${API_BASE_URL}/api/seo/urls?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) break
    const data = (await res.json()) as {
      pages?: number
      part_numbers?: string[]
      brands?: string[]
      categories?: string[]
    }
    if (typeof data.pages === 'number' && data.pages >= 1) pagesTotal = data.pages

    const rows =
      type === 'products'
        ? data.part_numbers ?? []
        : type === 'brands'
          ? data.brands ?? []
          : data.categories ?? []

    for (const raw of rows) {
      const seg = String(raw ?? '').trim()
      if (seg) locs.push(buildLoc(seg))
    }
    if (!rows.length) break
    page += 1
  }
  return [...new Set(locs)]
}

/** Product PDP URLs — upstream `/api/seo/urls` applies Article 5 filters. */
async function fetchAllProductUrls(): Promise<string[]> {
  return fetchAllSeoLocs('products', (seg) => canonicalPath(`/products/${encodeURIComponent(seg)}`))
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
