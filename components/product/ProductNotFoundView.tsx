import Link from 'next/link'
import { Package } from 'lucide-react'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { ProductNotFoundSearch } from '@/components/product/ProductNotFoundSearch'
import { resolveProductImage } from '@/lib/imageResolver'

export interface ProductNotFoundIntelligence {
  part_number: string
  manufacturer?: string | null
  brand?: string | null
  category?: string | null
  series?: string | null
}

export interface SimilarProductItem {
  part_number: string
  brand?: string
  manufacturer?: string
  category?: string
  image_url?: string
  images?: string[]
}

export interface ProductNotFoundViewProps {
  partNumber: string
  intelligence: ProductNotFoundIntelligence | null
  similarProducts: SimilarProductItem[]
  apiBase: string
}

function imageUrlFor(item: SimilarProductItem): string {
  const u = item.image_url ?? (Array.isArray(item.images) ? item.images[0] : null)
  return resolveProductImage(item.part_number, typeof u === 'string' ? u : undefined)
}

export function ProductNotFoundView({
  partNumber,
  intelligence,
  similarProducts,
  apiBase,
}: ProductNotFoundViewProps) {
  const possibleBrand = intelligence?.manufacturer ?? intelligence?.brand ?? null
  const possibleCategory = intelligence?.category ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-12 sm:py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-200 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h1>

          {/* Part number */}
          <p className="text-lg font-mono font-semibold text-gray-800 mb-1">
            Part Number: {partNumber}
          </p>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8">
            This part is not currently in our catalog but we may still be able to source it.
          </p>

          {/* Product intelligence: possible brand / category */}
          {(possibleBrand || possibleCategory) && (
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              {possibleBrand && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                  <span className="text-gray-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                    Possible Brand
                  </span>
                  <span className="text-gray-900 font-medium">{possibleBrand}</span>
                </div>
              )}
              {possibleCategory && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                  <span className="text-gray-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                    Possible Category
                  </span>
                  <span className="text-gray-900 font-medium">{possibleCategory}</span>
                </div>
              )}
            </div>
          )}

          {/* Primary action: RFQ */}
          <div className="mb-12">
            <Link
              href={`/rfq?part_number=${encodeURIComponent(partNumber)}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Request Quote for {partNumber}
            </Link>
          </div>

          {/* Quick search */}
          <div className="mb-12">
            <p className="text-sm text-gray-500 mb-3">Search for similar parts</p>
            <ProductNotFoundSearch defaultQuery={partNumber} />
          </div>
        </div>

        {/* Similar products: full-width section */}
        {similarProducts.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12 pt-10 border-t border-gray-200">
            <RelatedProducts
              products={similarProducts}
              productBasePath="/part-number"
              imageUrl={(item) => imageUrlFor(item)}
              title="Similar Products"
            />
          </div>
        )}
      </div>
    </div>
  )
}
