import { getCategories } from '@/lib/api'
import { API_BASE_URL } from '@/app/lib/constants'
import { CATEGORIES } from '@/app/lib/constants'
import { CategoryCard } from '@/components/ui/CategoryCard'

/** DB category values merged under the "Drives" slug (counts summed on categories page). */
const DRIVES_CATEGORY_ALIASES = ['Drives', 'VFD', 'Variable Frequency Drive']

export const metadata = {
  title: 'Product Categories | Advanced Systems',
  description: 'Browse industrial automation parts by category: PLC, drives, sensors, HMI, and more.',
}

async function getCategoryProductCount(categoryName: string): Promise<number> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/products?category=${encodeURIComponent(categoryName)}&limit=1`,
      { cache: 'no-store' }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return (
      data?.total ??
      data?.count ??
      (Array.isArray(data?.products) ? data.products.length : 0) ??
      0
    )
  } catch {
    return 0
  }
}

/** Count for "Drives" = sum of products in Drives, VFD, and Variable Frequency Drive (no double-count). */
async function getDrivesProductCount(): Promise<number> {
  const counts = await Promise.all(
    DRIVES_CATEGORY_ALIASES.map((cat) => getCategoryProductCount(cat))
  )
  return counts.reduce((a, b) => a + b, 0)
}

export default async function CategoriesPage() {
  let apiCategories: { name: string; slug?: string; product_count?: number }[] = []
  try {
    const data = await getCategories()
    apiCategories = Array.isArray(data) ? data : data?.categories || []
  } catch {}
  const baseCategories =
    apiCategories.length > 0
      ? apiCategories
      : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }))

  const categories = await Promise.all(
    baseCategories.map(async (cat) => {
      const count =
        cat.slug === 'drives'
          ? await getDrivesProductCount()
          : await getCategoryProductCount(cat.name)
      return { name: cat.name, slug: cat.slug, product_count: count }
    })
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Product Categories
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Browse our industrial automation catalog by category. Find PLCs, drives, sensors, and more.
          </p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              slug={cat.slug}
              product_count={cat.product_count}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
