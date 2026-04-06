import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/schneider-atv71-drive'

export const metadata: Metadata = {
  title: 'Schneider ATV71 Drive - Urgent Supply & RFQ',
  description:
    'Schneider Altivar ATV71 drive sourcing for critical industrial applications. Fast quote response, availability checks, and urgent delivery support.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Schneider ATV71 Drive - Urgent Supply & RFQ',
    description: 'In Stock - Ready to Ship support for Schneider ATV71 requirements.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function SchneiderAtv71DrivePage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Schneider ATV71 Drive',
    brand: { '@type': 'Brand', name: 'Schneider Electric' },
    category: 'Industrial VFD Drive',
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'Schneider ATV71 Drive', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script id="atv71-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="atv71-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="page-container py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Schneider ATV71 Drive</h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          ATV71 is widely used in heavy-duty and process-oriented motor control. Many factories still rely on this
          platform for critical assets, making fast spare availability essential during breakdown events.
        </p>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Product overview</h2>
              <p className="mt-2 text-sm text-[#6B7280]">Schneider Altivar ATV71 offers robust drive control for complex duty cycles and industrial process reliability.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Applications</h2>
              <ul className="mt-2 list-disc list-inside text-sm text-[#6B7280] space-y-1">
                <li>Material handling and lifting systems</li>
                <li>Industrial pumps and airflow systems</li>
                <li>Heavy process machinery and mixers</li>
                <li>Legacy line maintenance and replacement</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Why it is critical</h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                ATV71 failures can halt high-value process operations. Procurement teams require clear stock visibility
                and emergency logistics to avoid long downtime windows and delayed shipments.
              </p>
            </div>
          </section>
          <aside className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0072CE]">In Stock - Ready to Ship</p>
            <div className="mt-4 space-y-2">
              <Link href="/rfq" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] bg-[#0072CE] text-white text-sm font-semibold hover:bg-[#005BA4] transition-colors duration-150">Get Price in 2 Hours</Link>
              <a href="https://wa.me/201000629229?text=Need%20Schneider%20ATV71%20drive%20availability%20and%20price" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">WhatsApp</a>
            </div>
            <div className="mt-5 text-xs text-[#6B7280] space-y-1">
              <p><Link href="/brand/schneider" className="hover:text-[#0072CE]">Schneider brand page</Link></p>
              <p><Link href="/categories/drives" className="hover:text-[#0072CE]">Drive category</Link></p>
              <p><Link href="/products" className="hover:text-[#0072CE]">All products</Link></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
