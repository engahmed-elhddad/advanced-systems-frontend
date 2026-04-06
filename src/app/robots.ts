import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/app/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/preview',
          '/search',
          '/rfq/dashboard',
          '/login',
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
    ],
  }
}
