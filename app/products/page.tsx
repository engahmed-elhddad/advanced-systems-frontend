import { Suspense } from 'react'
import { ProductsClient } from './ProductsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Industrial Automation Products',
  description: 'Browse thousands of industrial automation products from leading manufacturers.',
}

export default function ProductsPage() {
  return (
    <div className="page-container py-8">
        <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <ProductsClient />
      </Suspense>
    </div>
  )
}

