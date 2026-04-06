export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="page-container py-10">
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-8 w-1/3 rounded bg-slate-200" />
          <div className="mt-4 h-5 w-1/2 rounded bg-slate-200" />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="aspect-square rounded-xl bg-slate-200" />
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-200" />
              <div className="h-4 w-5/6 rounded bg-slate-200" />
              <div className="mt-6 h-12 w-48 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
