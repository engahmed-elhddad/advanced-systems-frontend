import {
  COMPANY_BRAND_SHORT,
  COMPANY_DESCRIPTION,
  COMPANY_LOCATION_SINGLE_LINE,
  COMPANY_NAME_EN,
} from '@/lib/company'
import { CONTACT_EMAIL, PRODUCT_PLACEHOLDER_IMAGE, SITE_URL } from '@/lib/constants'

/** Organization + WebSite JSON-LD for homepage / global trust signals. */
export function SiteJsonLd() {
  const rawSameAs = process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS?.trim()
  const sameAs = rawSameAs
    ? rawSameAs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const logoUrl =
    SITE_URL.startsWith('http') ? `${SITE_URL}${PRODUCT_PLACEHOLDER_IMAGE}` : PRODUCT_PLACEHOLDER_IMAGE

  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'LocalBusiness'],
      name: COMPANY_NAME_EN,
      legalName: COMPANY_NAME_EN,
      description: COMPANY_DESCRIPTION,
      url: SITE_URL,
      logo: logoUrl,
      email: CONTACT_EMAIL,
      telephone: '+201000629229',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Jordanian District, Markaz Al-Azm Commercial, Shop 10',
        addressLocality: '10th of Ramadan City',
        addressRegion: 'Sharqia',
        addressCountry: 'EG',
      },
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: COMPANY_BRAND_SHORT,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  )
}
