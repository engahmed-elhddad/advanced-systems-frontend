import { CONTACT_EMAIL, WHATSAPP_NUMBER, supportPhoneDisplay, supportPhoneTelHref } from '@/lib/constants'
import {
  COMPANY_LOCATION_LINES,
  COMPANY_NAME_EN,
  COMPANY_TRUST_STATEMENTS,
} from '@/lib/company'
import { canonicalPath } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Reach ${COMPANY_NAME_EN} for quotes and industrial automation sourcing. Phone, email, and showroom address in 10th of Ramadan City, Egypt.`,
  alternates: { canonical: canonicalPath('/contact') },
}

export default function ContactPage() {
  const tel = supportPhoneTelHref()
  const phoneLabel = supportPhoneDisplay() || WHATSAPP_NUMBER

  return (
    <div className="min-h-[60vh] bg-[var(--background)]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1
          className="mb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Contact
        </h1>
        <p className="mb-2 text-sm font-semibold text-slate-700">{COMPANY_NAME_EN}</p>
        <p className="mb-10 text-slate-600">
          Quotes, technical questions, and sourcing for industrial automation and electrical supplies.
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {COMPANY_TRUST_STATEMENTS.map((t) => (
            <span
              key={t}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="space-y-6">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            <div>
              <span className="mb-0.5 block font-semibold text-slate-900">Email</span>
              <span className="font-medium text-teal-600 group-hover:underline">{CONTACT_EMAIL}</span>
            </div>
          </a>

          {tel ? (
            <a
              href={tel}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </span>
              <div>
                <span className="mb-0.5 block font-semibold text-slate-900">Phone</span>
                <span className="font-medium text-teal-600 group-hover:underline">{phoneLabel}</span>
              </div>
            </a>
          ) : null}

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div>
              <span className="mb-0.5 block font-semibold text-slate-900">Address</span>
              <p className="text-slate-600">
                {COMPANY_LOCATION_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          For part pricing and lead times, use{' '}
          <a href="/rfq" className="font-medium text-teal-700 underline-offset-2 hover:underline">
            Request a quote
          </a>{' '}
          — we respond quickly during business hours.
        </p>
      </div>
    </div>
  )
}
