import { Suspense } from 'react'
import type { Metadata } from 'next'
import * as productCatalog from '@/features/products/services'
import { canonicalPath } from '@/lib/seo'
import { SearchPageClient } from '@/components/search/SearchPageClient'
import { Spinner } from '@/components/ui'
import type { Brand, Category } from '@/types/product'

export const metadata: Metadata = {
  title: 'Search — Industrial Parts & Components',
  description:
    'Search part numbers, brands, and categories across the Advanced Systems catalog. Filter by specs, request quotes, and compare availability.',
  alternates: { canonical: canonicalPath('/search') },
  openGraph: {
    title: 'Search industrial parts',
    description: 'Part number search with filters and fast quote requests.',
    url: canonicalPath('/search'),
  },
}

export default async function SearchPage() {
  let brands: Brand[] = []
  let categories: Category[] = []
  try {
    const [b, c] = await Promise.all([
      productCatalog.getBrands().catch(() => [] as Brand[]),
      productCatalog.getCategories().catch(() => [] as Category[]),
    ])
    brands = Array.isArray(b) ? b : []
    categories = Array.isArray(c) ? c : []
  } catch {
    brands = []
    categories = []
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-white/50">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchPageClient brands={brands} categories={categories} />
    </Suspense>
  )
}
