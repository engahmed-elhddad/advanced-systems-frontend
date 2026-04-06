import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import * as productService from '@/services/productService'
import { ProductGrid } from '@/components/products/ProductGrid'
import { BrandGrid } from '@/components/home/BrandGrid'
import { ProductGridSkeleton } from '@/components/ui'
import type { Product, Brand } from '@/types/product'

export const metadata: Metadata = {
  title: 'Products — Industrial Automation Components',
  description: 'Browse PLCs, drives, sensors, and industrial automation components from Siemens, ABB, Schneider Electric and more.',
  alternates: { canonical: 'https://www.advancedsystems-int.com/products' },
}

const PRODUCTS_PER_PAGE = 30

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page = '1', q } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)

  let products: Product[] = []
  let brands: Brand[] = []
  let totalCount = 0
  let fetchError = false

  try {
    const [productsRes, brandsRes] = await Promise.all([
      productService.getProducts({
        page: pageNum,
        size: PRODUCTS_PER_PAGE,
        include_unready: true,
        ...(q ? { search: q } : {}),
      }),
      productService.getBrands().catch(() => [] as Brand[]),
    ])

    products = productsRes.items
    totalCount = productsRes.total
    brands = (Array.isArray(brandsRes) ? brandsRes : []).slice(0, 12)
  } catch {
    products = []
    fetchError = true
  }

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE) || 1

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="page-container py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Industrial Products
          </h1>
          <p className="mt-1 text-[#6B7280] text-sm sm:text-base max-w-2xl">
            Browse automation components from leading manufacturers — PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container py-8 sm:py-10 space-y-12">
        <Suspense fallback={<div className="h-32 bg-[#F9FAFB] animate-pulse rounded-[4px]" />}>
          <BrandGrid brands={brands} title="Top Manufacturers" viewAllHref="/brands" />
        </Suspense>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {q ? `Search: "${q}"` : 'All Products'}
            </h2>
            <span className="text-sm text-[#6B7280]">
              {totalCount} products
            </span>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={10} />}>
            {fetchError ? (
              <div className="text-center py-16 rounded-[4px] border border-red-200 bg-red-50">
                <p className="text-red-700 mb-4">Something went wrong</p>
                <Link
                  href={q ? `/products?q=${encodeURIComponent(q)}` : '/products'}
                  className="inline-flex px-5 py-2.5 rounded-[2px] bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                >
                  Retry
                </Link>
              </div>
            ) : products.length > 0 ? (
              <>
                <ProductGrid products={products as unknown as Array<Record<string, unknown>>} productBasePath="/products" />
                {totalPages > 1 && (
                  <nav className="flex justify-center gap-2 mt-10" aria-label="Pagination">
                    {pageNum > 1 && (
                      <Link
                        href={q ? `/products?page=${pageNum - 1}&q=${encodeURIComponent(q)}` : `/products?page=${pageNum - 1}`}
                        className="px-4 py-2 rounded-[2px] border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F9FAFB] text-sm font-medium transition-colors"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 text-[#6B7280] text-sm">
                      Page {pageNum} of {totalPages}
                    </span>
                    {pageNum < totalPages && (
                      <Link
                        href={q ? `/products?page=${pageNum + 1}&q=${encodeURIComponent(q)}` : `/products?page=${pageNum + 1}`}
                        className="px-4 py-2 rounded-[2px] border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F9FAFB] text-sm font-medium transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-16 rounded-[4px] border border-[#E5E7EB] bg-[#F9FAFB]">
                <p className="text-[#6B7280] mb-4">No products available</p>
                <Link
                  href="/search"
                  className="inline-flex px-5 py-2.5 rounded-[2px] bg-[#0072CE] hover:bg-[#005BA4] text-white font-medium text-sm transition-colors"
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
