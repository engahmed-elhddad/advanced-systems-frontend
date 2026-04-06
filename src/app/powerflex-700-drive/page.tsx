import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/powerflex-700-drive'

export const metadata: Metadata = {
  title: 'PowerFlex 700 Drive - Emergency Industrial Supply',
  description:
    'PowerFlex 700 drive supply for urgent maintenance and industrial downtime cases. Fast availability checks, RFQ response, and delivery support.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'PowerFlex 700 Drive - Emergency Industrial Supply',
    description: 'In Stock - Ready to Ship options for PowerFlex 700 drive requirements.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function PowerFlex700DrivePage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'PowerFlex 700 Drive',
    brand: { '@type': 'Brand', name: 'Allen-Bradley' },
    category: 'Industrial VFD Drive',
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'PowerFlex 700 Drive', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script id="pf700-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="pf700-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="page-container py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">PowerFlex 700 Drive</h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          PowerFlex 700 is widely deployed across process lines, manufacturing cells, and critical plant utilities.
          Failure events can be expensive and time-sensitive, especially when replacement stock is limited in region.
        </p>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Product overview</h2>
              <p className="mt-2 text-sm text-[#6B7280]">PowerFlex 700 provides reliable AC drive performance for medium-duty and heavy-duty industrial motor applications.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Applications</h2>
              <ul className="mt-2 list-disc list-inside text-sm text-[#6B7280] space-y-1">
                <li>Conveyor and packaging lines</li>
                <li>Mixing and pumping stations</li>
                <li>Material processing equipment</li>
                <li>Brownfield retrofit operations</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Why it is critical</h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                Plants with legacy Rockwell installations often depend on PowerFlex continuity for uptime. Fast sourcing
                and availability confirmation protects production schedules and maintenance KPIs.
              </p>
            </div>
          </section>
          <aside className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0072CE]">In Stock - Ready to Ship</p>
            <div className="mt-4 space-y-2">
              <Link href="/rfq" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] bg-[#0072CE] text-white text-sm font-semibold hover:bg-[#005BA4] transition-colors duration-150">Get Price in 2 Hours</Link>
              <a href="https://wa.me/201000629229?text=Need%20PowerFlex%20700%20drive%20availability%20and%20price" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">WhatsApp</a>
            </div>
            <div className="mt-5 text-xs text-[#6B7280] space-y-1">
              <p><Link href="/brand/allen-bradley" className="hover:text-[#0072CE]">Allen-Bradley brand page</Link></p>
              <p><Link href="/categories/drives" className="hover:text-[#0072CE]">Drive category</Link></p>
              <p><Link href="/products" className="hover:text-[#0072CE]">All products</Link></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
