import { getFeaturedProducts, getProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { productToCardProps } from '@/lib/productMappers'

export async function FeaturedProducts() {
  let products: any[] = []
  try {
    products = await getFeaturedProducts(12)
    if (!products?.length) {
      const data = await getProducts({ size: 12, page: 1 })
      products = data?.products ?? data?.items ?? []
    }
  } catch {
    try {
      const data = await getProducts({ size: 12, page: 1 })
      products = data?.products ?? data?.items ?? []
    } catch {}
  }

  if (!products.length) return null

  return (
    <section>
      <SectionHeader title="Trending Products" viewAllHref="/products" viewAllLabel="View all products" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <ProductCard key={p.id || p.part_number} {...productToCardProps(p)} variant="compact" />
        ))}
      </div>
    </section>
  )
}
