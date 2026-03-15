import { getFeaturedFromApi, getFeaturedProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { productToCardProps } from '@/lib/productMappers'

/** Fetches from /api/v1/featured; displays product cards (image, part number, brand). */
export async function FeaturedProducts() {
  let products: any[] = []
  try {
    products = await getFeaturedFromApi(12)
  } catch {
    try {
      products = await getFeaturedProducts(12)
    } catch {}
  }

  if (!products.length) return null

  return (
    <section>
      <SectionHeader title="Featured Products" viewAllHref="/products" viewAllLabel="View all products" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <ProductCard
            key={p.id ?? p.part_number}
            {...productToCardProps(p)}
            productBasePath="/product"
          />
        ))}
      </div>
    </section>
  )
}
