import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="page-container py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
          <p className="mt-2 text-sm text-slate-600">This part number is unavailable or has been removed.</p>
          <Link
            href="/search"
            className="mt-4 inline-flex rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Search Products
          </Link>
        </div>
      </div>
    </div>
  )
}
