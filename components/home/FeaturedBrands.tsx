import { getBrands } from '@/lib/api'
import { BrandGrid } from './BrandGrid'

export async function FeaturedBrands() {
  let brands: { name: string; slug?: string; product_count?: number; count?: number }[] = []
  try {
    const data = await getBrands()
    brands = (Array.isArray(data) ? data : (data as { brands?: typeof brands })?.brands || []).slice(0, 12)
  } catch {}

  return <BrandGrid brands={brands} title="Top Manufacturers" viewAllHref="/brands" />
}
