import Link from 'next/link'
import { getCategories } from '@/lib/api'
import { CATEGORIES, normalizeCategoryQueryForApi } from '@/app/lib/constants'
import { getCategoryIcon } from '@/lib/categoryIcons'

type Cat = { name: string; slug?: string; count?: number; product_count?: number }

export async function CategoriesGrid() {
  let apiCats: Cat[] = []
  try {
    const data = await getCategories()
    const arr = Array.isArray(data) ? data : data.categories || []
    apiCats = arr.slice(0, 12)
  } catch {}
  const categories: Cat[] =
    apiCats.length > 0 ? apiCats : CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }))

  if (!categories.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Popular Categories</h2>
        <Link href="/categories" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          View all categories →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name)
          const href = cat.slug
            ? `/categories/${cat.slug}`
            : `/search?category=${encodeURIComponent(normalizeCategoryQueryForApi(cat.name))}`
          const count = cat.count ?? cat.product_count ?? 0
          return (
            <Link
              key={cat.name}
              href={href}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-900 text-sm truncate">{cat.name}</div>
                {count > 0 && (
                  <div className="text-xs text-slate-500">{count} parts</div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
