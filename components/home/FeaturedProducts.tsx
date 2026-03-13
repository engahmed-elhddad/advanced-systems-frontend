import Link from 'next/link'
import { getFeaturedProducts, getProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'

export async function FeaturedProducts() {
  let products: any[] = []
  try {
    products = await getFeaturedProducts(8)
    if (!products?.length) {
      const data = await getProducts({ size: 8, page: 1 })
      products = data?.items || []
    }
  } catch {}

  if (!products.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Latest Products</h2>
        <Link href="/products" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <ProductCard
            key={p.id || p.part_number}
            part_number={p.part_number}
            manufacturer={p.brand?.name}
            category={p.category?.name}
            description={p.short_description || p.description}
            image_url={p.images?.[0]?.url || p.primary_image}
            stock_quantity={p.stock_quantity}
            availability={p.availability === 'available' || (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'on_request'}
            price_usd={p.price_usd}
          />
        ))}
      </div>
    </section>
  )
}
