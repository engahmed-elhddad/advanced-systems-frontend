import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/siemens-g120-drive'

export const metadata: Metadata = {
  title: 'Siemens G120 Drive - Fast Industrial Supply',
  description:
    'Get Siemens SINAMICS G120 drive availability and pricing for urgent industrial maintenance and production support. In Stock - Ready to Ship.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Siemens G120 Drive - Fast Industrial Supply',
    description: 'Emergency supply support for Siemens G120 drive systems.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function SiemensG120DrivePage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Siemens G120 Drive',
    brand: { '@type': 'Brand', name: 'Siemens' },
    category: 'Industrial VFD Drive',
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'Siemens G120 Drive', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script id="g120-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="g120-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="page-container py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Siemens G120 Drive</h1>
        <p className="mt-3 max-w-3xl text-[#6B7280]">
          Siemens G120 is a high-demand modular drive platform for critical motor applications. When a power module,
          control unit, or accessory fails, plants need immediate availability and technically correct replacement.
        </p>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Product overview</h2>
              <p className="mt-2 text-sm text-[#6B7280]">The G120 family supports broad power ranges and industrial communication options for demanding automation systems.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Applications</h2>
              <ul className="mt-2 list-disc list-inside text-sm text-[#6B7280] space-y-1">
                <li>Conveyors and material handling lines</li>
                <li>Extruders and process equipment</li>
                <li>Packaging and OEM machinery</li>
                <li>Heavy-duty industrial utility systems</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Why it is critical</h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                G120 drives are often integrated into production bottlenecks; failures can cause complete process stoppage.
                Rapid supply reduces downtime and allows maintenance teams to restore line output quickly.
              </p>
            </div>
          </section>
          <aside className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0072CE]">In Stock - Ready to Ship</p>
            <div className="mt-4 space-y-2">
              <Link href="/rfq" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] bg-[#0072CE] text-white text-sm font-semibold hover:bg-[#005BA4] transition-colors duration-150">Get Price in 2 Hours</Link>
              <a href="https://wa.me/201000629229?text=Need%20Siemens%20G120%20drive%20availability%20and%20price" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">WhatsApp</a>
            </div>
            <div className="mt-5 text-xs text-[#6B7280] space-y-1">
              <p><Link href="/brand/siemens" className="hover:text-[#0072CE]">Siemens brand page</Link></p>
              <p><Link href="/categories/drives" className="hover:text-[#0072CE]">Drive category</Link></p>
              <p><Link href="/products" className="hover:text-[#0072CE]">All products</Link></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
