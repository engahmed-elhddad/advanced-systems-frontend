import { getCategories } from '@/lib/api'
import { CATEGORIES } from '@/app/lib/constants'
import { CategoryCard } from '@/components/ui/CategoryCard'

export const metadata = {
  title: 'Product Categories | Advanced Systems',
  description: 'Browse industrial automation parts by category: PLC, drives, sensors, HMI, and more.',
}

export default async function CategoriesPage() {
  let apiCategories: { name: string; slug?: string; product_count?: number }[] = []
  try {
    const data = await getCategories()
    apiCategories = Array.isArray(data) ? data : data?.categories || []
  } catch {}
  const categories =
    apiCategories.length > 0
      ? apiCategories
      : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, product_count: 0 }))

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
