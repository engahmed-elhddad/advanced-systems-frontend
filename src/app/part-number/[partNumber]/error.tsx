'use client'

export default function ProductError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="page-container py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow">
          <h2 className="text-xl font-semibold text-amber-900">Having trouble loading data</h2>
          <p className="mt-2 text-sm text-amber-800">Please try again or contact us instantly on WhatsApp.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Try again
            </button>
            <a
              href={`https://wa.me/201000629229?text=${encodeURIComponent('Hello, I need help finding an industrial part')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              WhatsApp instantly
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
