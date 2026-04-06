import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

const PAGE_URL = 'https://www.advancedsystems-int.com/emergency-industrial-spare-parts'

export const metadata: Metadata = {
  title: 'Emergency Industrial Spare Parts - In Stock & Immediate Delivery',
  description:
    'Emergency supply for PLCs, VFD drives, sensors, contactors, and industrial electrical spare parts. In Stock - Ready to Ship. Fast RFQ response in 2-4 hours.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Emergency Industrial Spare Parts - In Stock & Immediate Delivery',
    description:
      'Factory downtime support with fast emergency supply for critical industrial automation parts.',
    url: PAGE_URL,
    type: 'website',
  },
}

export default function EmergencyIndustrialSparePartsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.advancedsystems-int.com/' },
      { '@type': 'ListItem', position: 2, name: 'Emergency Industrial Spare Parts', item: PAGE_URL },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Script
        id="emergency-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="page-container py-12">
          <nav className="text-xs text-[#6B7280] mb-3">
            <Link href="/" className="hover:text-[#0072CE]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#1A1A1A]">Emergency Industrial Spare Parts</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
            Emergency Industrial Spare Parts - In Stock & Ready for Immediate Delivery
          </h1>
          <p className="mt-4 max-w-3xl text-[#6B7280] text-base leading-relaxed">
            Production line stopped? We supply critical PLCs, drives, sensors, and electrical components with
            emergency handling. In Stock - Ready to Ship to reduce downtime and restore operations fast.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/rfq"
              className="inline-flex items-center px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm transition-colors duration-150"
            >
              Get Price in 2 Hours
            </Link>
            <a
              href="https://wa.me/201000629229?text=Emergency%20need%20for%20industrial%20spare%20parts.%20Please%20assist%20immediately."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] font-medium text-sm hover:bg-white transition-colors duration-150"
            >
              WhatsApp Emergency Support
            </a>
          </div>
        </div>
      </div>

      <div className="page-container py-10 space-y-8">
        <section className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Why downtime is costly</h2>
          <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
            In industrial environments, one failed drive, PLC module, or protection component can stop the whole
            process chain. Downtime affects OEE, delivery commitments, and operating cost. Maintenance teams need
            a supplier that can respond immediately with correct part matching, realistic availability, and fast
            dispatch. Our emergency supply workflow is designed for urgent buyer scenarios where time matters more
            than anything else.
          </p>
        </section>

        <section className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A]">In-stock advantage for urgent plants</h2>
          <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
            We prioritize in-stock and ready-to-ship items for critical breakdown cases. For hard-to-find and obsolete
            references, our sourcing team checks alternatives and verified channels quickly. You get a fast answer on
            availability, lead time, and quote options so procurement can act without delay.
          </p>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#1A1A1A]">
            <li className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">In Stock - Ready to Ship</li>
            <li className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">Fast quote turnaround (2-4h typical)</li>
            <li className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">Support for obsolete part numbers</li>
            <li className="rounded-[2px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">Emergency WhatsApp coordination</li>
          </ul>
        </section>

        <section className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Critical product categories</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/categories/plc" className="rounded-[2px] border border-[#E5E7EB] p-4 hover:border-[#0072CE]/40 hover:shadow-sm transition-all duration-150">
              <h3 className="font-semibold text-[#1A1A1A]">PLC</h3>
              <p className="text-xs text-[#6B7280] mt-1">CPU modules, I/O cards, communication modules.</p>
            </Link>
            <Link href="/categories/drives" className="rounded-[2px] border border-[#E5E7EB] p-4 hover:border-[#0072CE]/40 hover:shadow-sm transition-all duration-150">
              <h3 className="font-semibold text-[#1A1A1A]">Drives (VFD)</h3>
              <p className="text-xs text-[#6B7280] mt-1">AC drives for pumps, fans, conveyors, mixers.</p>
            </Link>
            <Link href="/categories/sensors" className="rounded-[2px] border border-[#E5E7EB] p-4 hover:border-[#0072CE]/40 hover:shadow-sm transition-all duration-150">
              <h3 className="font-semibold text-[#1A1A1A]">Sensors</h3>
              <p className="text-xs text-[#6B7280] mt-1">Inductive, photoelectric, safety, and process sensors.</p>
            </Link>
            <Link href="/products?category=electrical" className="rounded-[2px] border border-[#E5E7EB] p-4 hover:border-[#0072CE]/40 hover:shadow-sm transition-all duration-150">
              <h3 className="font-semibold text-[#1A1A1A]">Electrical</h3>
              <p className="text-xs text-[#6B7280] mt-1">Contactors, overload relays, power supplies, breakers.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Emergency service workflow</h2>
          <ol className="mt-4 space-y-3 text-sm text-[#6B7280] list-decimal list-inside">
            <li>Send part number list via RFQ or WhatsApp.</li>
            <li>Receive fast availability and pricing confirmation.</li>
            <li>Approve quote and shipping method for immediate dispatch.</li>
            <li>Get updates until parts arrive on site.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex items-center px-5 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">
              Browse Products
            </Link>
            <Link href="/brand/siemens" className="inline-flex items-center px-5 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">
              Siemens Parts
            </Link>
            <Link href="/categories/drives" className="inline-flex items-center px-5 py-2.5 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] text-sm font-medium hover:bg-[#F9FAFB] transition-colors duration-150">
              VFD Drives
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
