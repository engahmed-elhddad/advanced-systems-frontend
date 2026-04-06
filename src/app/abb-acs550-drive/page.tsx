import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/abb-acs550-drive'

export const metadata: Metadata = {
  title: 'ABB ACS550 Drive - Industrial VFD Availability',
  description:
    'Source ABB ACS550 drives for pumps, HVAC, and process lines. Fast availability checks, urgent RFQ support, and delivery options for industrial buyers.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'ABB ACS550 Drive - Industrial VFD Availability',
    description: 'In Stock - Ready to Ship ABB ACS550 drives for urgent industrial requirements.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function AbbAcs550DrivePage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ABB ACS550 Drive',
    brand: { '@type': 'Brand', name: 'ABB' },
    category: 'Industrial VFD Drive',
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'ABB ACS550 Drive', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script id="acs550-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="acs550-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="page-container py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">ABB ACS550 Drive</h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          ABB ACS550 is a proven general-purpose drive used heavily in industrial plants, utilities, water treatment,
          and HVAC assets. If an ACS550 fails, uptime can be affected immediately; rapid replacement is often mandatory.
        </p>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Product overview</h2>
              <p className="mt-2 text-sm text-[#6B7280]">ACS550 provides stable motor control, process reliability, and practical commissioning for a wide range of fan and pump applications.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Applications</h2>
              <ul className="mt-2 list-disc list-inside text-sm text-[#6B7280] space-y-1">
                <li>Water and wastewater pumping stations</li>
                <li>HVAC fan and air handling systems</li>
                <li>Conveyor and utility process control</li>
                <li>Industrial retrofit and maintenance programs</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Why it is critical</h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                In many facilities, ACS550 drives control bottleneck equipment. Delays in sourcing cause extended downtime,
                production loss, and overtime maintenance cost. Fast supply and verified model matching reduces risk.
              </p>
            </div>
          </section>
          <aside className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0072CE]">In Stock - Ready to Ship</p>
            <div className="mt-4 space-y-2">
              <Link href="/rfq" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] bg-[#0072CE] text-white text-sm font-semibold hover:bg-[#005BA4] transition-colors duration-150">Get Price in 2 Hours</Link>
              <a href="https://wa.me/201000629229?text=Need%20ABB%20ACS550%20drive%20availability%20and%20price" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">WhatsApp</a>
            </div>
            <div className="mt-5 text-xs text-[#6B7280] space-y-1">
              <p><Link href="/brand/abb" className="hover:text-[#0072CE]">ABB brand page</Link></p>
              <p><Link href="/categories/drives" className="hover:text-[#0072CE]">Drive category</Link></p>
              <p><Link href="/products" className="hover:text-[#0072CE]">All products</Link></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
