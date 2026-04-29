import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

const BASE = SITE_URL.replace(/\/$/, '')

export const revalidate = 3600

/** Sitemap index — lastmod uses UTC “today” until cron writes `sitemap_audit_log` rows (spec 009 US2). */
function sharedLastmod(): string {
  return new Date().toISOString()
}

export async function GET() {
  const lastmod = sharedLastmod()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE}/sitemap-products.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-brands.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-categories.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
