export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-10">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  )
}
