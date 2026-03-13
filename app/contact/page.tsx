export default function ContactPage() {
  return (
    <div className="min-h-[60vh] bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1
          className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Contact Advanced Systems
        </h1>
        <p className="text-slate-600 mb-10">
          Get in touch for quotes, technical support, or sourcing industrial
          automation parts.
        </p>

        <div className="space-y-6">
          <a
            href="mailto:eng.ahmed@advancedsystems-int.com"
            className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-teal-200 transition group"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <span className="block font-semibold text-slate-900 mb-0.5">Email</span>
              <span className="text-teal-600 font-medium group-hover:underline">
                eng.ahmed@advancedsystems-int.com
              </span>
            </div>
          </a>

          <a
            href="tel:+201000629229"
            className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-teal-200 transition group"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <div>
              <span className="block font-semibold text-slate-900 mb-0.5">Phone</span>
              <span className="text-teal-600 font-medium group-hover:underline">
                +201000629229
              </span>
            </div>
          </a>

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div>
              <span className="block font-semibold text-slate-900 mb-0.5">Address</span>
              <p className="text-slate-600">
                Jordanian District, Markaz Al-Azm Commercial · Shop 10<br />
                10th of Ramadan City – Egypt
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-slate-500 text-sm">
          For RFQs or product inquiries, use the RFQ button in the navigation or
          email us directly.
        </p>
      </div>
    </div>
  )
}
