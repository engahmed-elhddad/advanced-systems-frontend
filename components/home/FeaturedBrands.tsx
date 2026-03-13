import Link from 'next/link'
import { getBrands } from '@/lib/api'

export async function FeaturedBrands() {
  let brands: { name: string; slug?: string; product_count?: number }[] = []
  try {
    const data = await getBrands()
    brands = (Array.isArray(data) ? data : data?.brands || []).slice(0, 12)
  } catch {}

  if (!brands.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Featured Brands</h2>
        <Link href="/brands" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map(brand => (
          <Link
            key={brand.name}
            href={brand.slug ? `/brand/${encodeURIComponent(brand.slug)}` : `/brands`}
            className="card p-5 text-center group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {brand.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">{(brand.product_count ?? brand.count ?? 0)} products</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
