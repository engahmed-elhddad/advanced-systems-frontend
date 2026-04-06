import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/siemens-micromaster-440'

export const metadata: Metadata = {
  title: 'Siemens MicroMaster 440 - In Stock Drive Supply',
  description:
    'Buy Siemens MicroMaster 440 VFD drive with fast availability support, replacement guidance, and urgent RFQ handling for factories in Egypt and Middle East.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Siemens MicroMaster 440 - In Stock Drive Supply',
    description:
      'Emergency supply for Siemens MicroMaster 440 drives. In Stock - Ready to Ship.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function SiemensMicroMaster440Page() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Siemens MicroMaster 440',
    brand: { '@type': 'Brand', name: 'Siemens' },
    category: 'Industrial VFD Drive',
    description: 'Industrial AC drive for conveyors, pumps, and variable speed motor applications.',
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'Siemens MicroMaster 440', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script id="mm440-product-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="mm440-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="page-container py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Siemens MicroMaster 440</h1>
        <p className="mt-3 text-[#6B7280] max-w-3xl">
          The MicroMaster 440 remains one of the most requested legacy Siemens drives for retrofits and maintenance.
          For factories running older motor control systems, failure of a single drive can stop throughput immediately.
          We support urgent sourcing and replacement planning with quick RFQ turnaround.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Product overview</h2>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                Siemens MicroMaster 440 is a vector control VFD used widely in conveyors, fans, pumps, mixers, and
                packaging machinery. It offers stable torque behavior and reliable speed control in demanding plant
                environments where uptime is critical.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Applications</h2>
              <ul className="mt-2 list-disc list-inside text-sm text-[#6B7280] space-y-1">
                <li>Conveyor speed control in production lines</li>
                <li>Pump and fan energy optimization</li>
                <li>Retrofit projects replacing failed legacy drives</li>
                <li>Emergency replacement during unexpected downtime</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Why it is critical</h2>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                When a legacy drive fails, restarting production often depends on finding the same model fast or
                a verified compatible alternative. Our team helps maintenance engineers and procurement teams shorten
                downtime by supplying in-stock options and technical matching support.
              </p>
            </div>
          </section>

          <aside className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-[#0072CE] uppercase tracking-wide">In Stock - Ready to Ship</p>
            <h3 className="mt-2 text-lg font-bold text-[#1A1A1A]">Need urgent pricing?</h3>
            <p className="mt-2 text-sm text-[#6B7280]">Get quote and availability fast for Siemens drive requirements.</p>
            <div className="mt-4 space-y-2">
              <Link href="/rfq" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white text-sm font-semibold transition-colors duration-150">Get Price in 2 Hours</Link>
              <a href="https://wa.me/201000629229?text=Need%20Siemens%20MicroMaster%20440%20pricing%20and%20availability" target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center px-4 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">WhatsApp</a>
            </div>
            <div className="mt-5 text-xs text-[#6B7280] space-y-1">
              <p><Link href="/brand/siemens" className="hover:text-[#0072CE]">Explore Siemens brand page</Link></p>
              <p><Link href="/categories/drives" className="hover:text-[#0072CE]">Browse VFD drive category</Link></p>
              <p><Link href="/products" className="hover:text-[#0072CE]">View all industrial products</Link></p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
