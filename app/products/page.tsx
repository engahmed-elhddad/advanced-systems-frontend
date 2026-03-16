import { Suspense } from 'react'
import Link from 'next/link'
import { getProducts, getBrands } from '@/lib/api'
import { ProductGrid } from '@/components/products/ProductGrid'
import { BrandGrid } from '@/components/home/BrandGrid'
import { ProductGridSkeleton } from '@/components/ui'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products — Industrial Automation Components',
  description: 'Browse PLCs, drives, sensors, and industrial automation components from leading manufacturers.',
}

const PRODUCTS_PER_PAGE = 30

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page = '1', q } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)

  let products: unknown[] = []
  let brands: { name: string; slug?: string; product_count?: number; count?: number }[] = []
  let totalCount = 0

  try {
    const [productsRes, brandsRes] = await Promise.all([
      getProducts({
        page: pageNum,
        size: PRODUCTS_PER_PAGE,
        ...(q ? { search: q } : {}),
      } as Record<string, unknown>),
      getBrands().catch(() => []),
    ])

    const res = productsRes as { items?: unknown[]; results?: unknown[]; products?: unknown[]; total?: number; count?: number }
    products = res?.results ?? res?.products ?? res?.items ?? (Array.isArray(productsRes) ? productsRes : [])
    totalCount = res?.total ?? res?.count ?? (products as unknown[]).length
    brands = Array.isArray(brandsRes)
      ? brandsRes.slice(0, 12)
      : ((brandsRes as { brands?: typeof brands })?.brands ?? []).slice(0, 12)
  } catch {
    products = []
  }

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE) || 1

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50/50">
        <div className="page-container py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Industrial Products
          </h1>
          <p className="mt-1 text-slate-600 text-sm sm:text-base max-w-2xl">
            Browse automation components from 500+ manufacturers — PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container py-8 sm:py-10 space-y-12">
        {/* Featured brands */}
        <Suspense fallback={<div className="h-32 skeleton rounded-xl" />}>
          <BrandGrid brands={brands} title="Top Manufacturers" viewAllHref="/brands" />
        </Suspense>

        {/* Product grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {q ? `Search: "${q}"` : 'All Products'}
            </h2>
            <span className="text-sm text-slate-500">
              {totalCount} products
            </span>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={10} />}>
            {products.length > 0 ? (
              <>
                <ProductGrid products={products as Array<Record<string, unknown>>} productBasePath="/part-number" />
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {pageNum > 1 && (
                      <Link
                        href={q ? `/products?page=${pageNum - 1}&q=${encodeURIComponent(q)}` : `/products?page=${pageNum - 1}`}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 text-slate-600 text-sm">
                      Page {pageNum} of {totalPages}
                    </span>
                    {pageNum < totalPages && (
                      <Link
                        href={q ? `/products?page=${pageNum + 1}&q=${encodeURIComponent(q)}` : `/products?page=${pageNum + 1}`}
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-slate-600 mb-4">No products found.</p>
                <Link
                  href="/search"
                  className="inline-flex px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm transition-colors"
                >
                  Search Products
                </Link>
              </div>
            )}
          </Suspense>
        </section>
      </div>
    </div>
  )
}
