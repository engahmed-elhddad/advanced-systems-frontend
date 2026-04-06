export function ProductSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full mt-4" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
            <div className="h-8 w-14 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}
