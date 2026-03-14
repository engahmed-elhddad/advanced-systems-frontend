import { getFeaturedProducts, getProducts } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { productToCardProps } from '@/lib/productMappers'

export async function FeaturedProducts() {
  let products: any[] = []
  try {
    products = await getFeaturedProducts(8)
    if (process.env.NODE_ENV === 'development') {
      console.log('[FeaturedProducts] /api/v1/featured response:', products?.length ?? 0, 'products')
    }
    if (!products?.length) {
      const data = await getProducts({ size: 8, page: 1 })
      products = data?.items ?? data?.products ?? []
      if (process.env.NODE_ENV === 'development') {
        console.log('[FeaturedProducts] fallback getProducts:', products?.length ?? 0, 'products')
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FeaturedProducts] Error loading featured:', e)
    }
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
