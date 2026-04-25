import { Suspense } from 'react'
import type { Metadata } from 'next'
import * as productCatalog from '@/features/products/services'
import { canonicalPath } from '@/lib/seo'
import { BrandGrid } from '@/components/home/BrandGrid'
import { ProductBrowseClient } from '@/components/products/ProductBrowseClient'
import { ProductGridSkeleton } from '@/components/ui'
import type { Brand, Category } from '@/types/product'

export const metadata: Metadata = {
  title: 'Products — Industrial Automation Components',
  description:
    'Browse PLCs, drives, sensors, HMIs, and industrial automation components from leading manufacturers. Request a quote on any line.',
  alternates: { canonical: canonicalPath('/products') },
  openGraph: {
    title: 'Industrial automation products',
    description: 'Browse and request quotes on PLCs, drives, sensors, and more.',
    url: canonicalPath('/products'),
  },
}

export default async function ProductsPage() {
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

  const brandsForStrip = brands.slice(0, 12)

  return (
    <div className="relative min-h-screen pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="border-b border-[--border] bg-[--bg-surface]">
        <div className="page-container py-8 sm:py-10">
          <h1 className="text-2xl font-bold tracking-tight text-[--text-primary] sm:text-3xl">Industrial Products</h1>
          <p className="mt-1 max-w-2xl text-sm text-[--text-secondary] sm:text-base">
            Browse automation components from leading manufacturers — PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container relative z-10 space-y-12 py-8 sm:py-10">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-[--bg-elevated]" />}>
          <BrandGrid brands={brandsForStrip} title="Top Manufacturers" viewAllHref="/brands" />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton count={10} />}>
          <ProductBrowseClient brands={brands} categories={categories} />
        </Suspense>
      </div>
    </div>
  )
}
