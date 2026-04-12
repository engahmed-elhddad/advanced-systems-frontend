import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Globe, Clock, Shield, MapPin } from 'lucide-react'
import {
  COMPANY_BRANDS,
  COMPANY_BUSINESS_MODEL,
  COMPANY_DESCRIPTION,
  COMPANY_LOCATION_LINES,
  COMPANY_NAME_AR,
  COMPANY_NAME_EN,
  COMPANY_TRUST_STATEMENTS,
} from '@/lib/company'
import { CONTACT_EMAIL, SITE_URL, supportPhoneDisplay, supportPhoneTelHref } from '@/lib/constants'
import { canonicalPath } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Us — Industrial Automation & Electrical Supplies',
  description: `${COMPANY_DESCRIPTION.slice(0, 155)}…`,
  alternates: { canonical: canonicalPath('/about') },
}

export default function AboutPage() {
  const tel = supportPhoneTelHref()
  const phoneLabel = supportPhoneDisplay()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">{COMPANY_NAME_EN}</h1>
        <p className="mb-1 text-lg font-medium text-[#374151]" dir="rtl" lang="ar">
          {COMPANY_NAME_AR}
        </p>
        <p className="mb-12 max-w-2xl text-lg text-[#6B7280]">{COMPANY_DESCRIPTION}</p>

        <div className="mb-12 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-xl font-semibold text-[#1A1A1A]">How we work</h2>
          <ul className="space-y-2 text-[#6B7280]">
            {COMPANY_BUSINESS_MODEL.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0072CE]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[#F3F4F6] pt-6">
            {COMPANY_TRUST_STATEMENTS.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-900"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-12 flex items-start gap-3 rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-[#0072CE]" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Location</h2>
            <p className="mt-1 text-[#6B7280] leading-relaxed">
              {COMPANY_LOCATION_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-4 space-y-1 text-sm">
              {tel ? (
                <p>
                  <span className="font-medium text-[#1A1A1A]">Phone: </span>
                  <a href={tel} className="text-[#0072CE] hover:underline">
                    {phoneLabel}
                  </a>
                </p>
              ) : null}
              <p>
                <span className="font-medium text-[#1A1A1A]">Email: </span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0072CE] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate mb-16 max-w-none">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Brands we support</h2>
          <p className="text-[#6B7280] leading-relaxed">
            We source genuine components across leading industrial brands, including{' '}
            {COMPANY_BRANDS.slice(0, -1).join(', ')}, and {COMPANY_BRANDS[COMPANY_BRANDS.length - 1]}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            { icon: Clock, title: 'Fast response', desc: 'We typically reply within 2–6 hours on business days.' },
            { icon: Globe, title: 'Global sourcing', desc: 'In-stock items plus international sourcing for hard-to-find parts.' },
            { icon: Shield, title: 'Registered supplier', desc: COMPANY_TRUST_STATEMENTS.join(' · ') },
            { icon: Zap, title: 'Industrial focus', desc: 'Automation, drives, PLCs, sensors, and electrical supplies for factories.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[2px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <item.icon className="mb-3 h-6 w-6 text-[#0072CE]" />
              <h3 className="mb-1 font-semibold text-[#1A1A1A]">{item.title}</h3>
              <p className="text-sm text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[2px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-[#1A1A1A]">Need a quote?</h2>
          <p className="mb-5 text-[#6B7280]">Submit a request — we will return pricing and lead time quickly.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/rfq"
              className="inline-flex items-center rounded-[2px] bg-[#0072CE] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#005BA4]"
            >
              Request a quote
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-[2px] border border-[#E5E7EB] px-6 py-3 text-sm font-medium text-[#1A1A1A] transition-colors duration-150 hover:bg-[#F9FAFB]"
            >
              Contact
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
            name: COMPANY_NAME_EN,
            legalName: COMPANY_NAME_EN,
            alternateName: COMPANY_NAME_AR,
            url: SITE_URL.replace(/\/$/, ''),
            description: COMPANY_DESCRIPTION,
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${COMPANY_LOCATION_LINES[0]}, ${COMPANY_LOCATION_LINES[1]}`,
              addressLocality: COMPANY_LOCATION_LINES[0].split(',')[0],
              addressCountry: 'EG',
            },
            telephone: tel ? tel.replace('tel:', '') : undefined,
            email: CONTACT_EMAIL,
            sameAs: [`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201000629229'}`],
          }),
        }}
      />
    </div>
  )
}
