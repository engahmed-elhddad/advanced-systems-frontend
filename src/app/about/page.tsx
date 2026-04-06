import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Globe, Clock, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Advanced Systems — Industrial Automation Parts Supplier',
  description: 'Advanced Systems is an industrial automation parts supplier based in 10th of Ramadan City, Egypt. We source PLCs, drives, sensors from Siemens, ABB, Schneider.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight mb-4">
          About Advanced Systems
        </h1>
        <p className="text-lg text-[#6B7280] mb-12 max-w-2xl">
          Your trusted partner for industrial automation parts sourcing in the Middle East and beyond.
        </p>

        <div className="prose prose-slate max-w-none mb-16">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Who We Are</h2>
          <p className="text-[#6B7280] leading-relaxed">
            Advanced Systems is an industrial automation parts supplier headquartered in 10th of Ramadan City, Egypt.
            We specialize in sourcing and supplying genuine industrial components from the world&apos;s leading
            manufacturers — including Siemens, ABB, Schneider Electric, Omron, Mitsubishi, and more.
          </p>
          <p className="text-[#6B7280] leading-relaxed">
            Our catalog covers PLCs, variable frequency drives (VFDs), HMI panels, industrial sensors, power supplies,
            safety relays, soft starters, and servo systems. Whether you need a single replacement part or a bulk order
            for a new production line, we provide fast quotes and reliable delivery.
          </p>

          <h2 className="text-xl font-semibold text-[#1A1A1A] mt-10">What We Do</h2>
          <p className="text-[#6B7280] leading-relaxed">
            We bridge the gap between manufacturers and industrial end-users. Our RFQ-based model means you get
            competitive pricing without the overhead of maintaining large inventories. Submit a part number, get a
            quote within hours, and receive your parts with full quality assurance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {[
            { icon: Clock, title: 'Fast Response', desc: 'Get pricing within 2–4 hours during business days.' },
            { icon: Globe, title: 'Global Sourcing', desc: 'Parts sourced from verified suppliers across Europe, Asia, and the Americas.' },
            { icon: Shield, title: 'Quality Assured', desc: 'All parts verified for authenticity. Genuine products only.' },
            { icon: Zap, title: 'Expert Support', desc: 'Our engineers help you find the right part for your application.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <item.icon className="w-6 h-6 text-[#0072CE] mb-3" />
              <h3 className="font-semibold text-[#1A1A1A] mb-1">{item.title}</h3>
              <p className="text-sm text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Need a part?</h2>
          <p className="text-[#6B7280] mb-5">Submit a request and get pricing within hours.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/rfq"
              className="inline-flex items-center px-6 py-3 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-semibold text-sm shadow-sm transition-colors duration-150"
            >
              Get Price in 2 Hours
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 rounded-[2px] border border-[#E5E7EB] text-[#1A1A1A] font-medium text-sm hover:bg-[#F9FAFB] transition-colors duration-150"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Advanced Systems',
            url: 'https://www.advancedsystems-int.com',
            description: 'Industrial automation parts supplier based in Egypt. Sourcing PLCs, drives, sensors from Siemens, ABB, Schneider Electric.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Jordanian District, Markaz Al-Azm Commercial, Shop 10',
              addressLocality: '10th of Ramadan City',
              addressCountry: 'EG',
            },
            telephone: '+201000629229',
            email: 'eng.ahmed@advancedsystems-int.com',
            sameAs: ['https://wa.me/201000629229'],
          }),
        }}
      />
    </div>
  )
}
