'use client'

export default function CategoryError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">Something went wrong</p>
          <p className="mt-1 text-sm text-red-600">{error.message || 'Unable to load category products.'}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}
